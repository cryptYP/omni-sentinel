/**
 * Tenderly VTestNet Auto-Rotation API — /api/tenderly/rotate
 *
 * Creates a new Tenderly Virtual TestNet forked from Sepolia when the current
 * one hits its block height limit or quota is reached. Automatically deletes
 * old VTestNets (keeps max 2) before creating a new one to stay within
 * Tenderly free tier limits.
 *
 * Prize tracks: Tenderly Virtual TestNets ($5k)
 * Sponsors: Tenderly Virtual TestNets
 */
import { NextResponse } from "next/server";

const TENDERLY_API = "https://api.tenderly.co/api/v1";
const MAX_VNETS_TO_KEEP = 2; // Keep at most 2 VTestNets (current + 1 historical)

/**
 * Delete old VTestNets to free quota. Keeps the newest MAX_VNETS_TO_KEEP.
 */
async function cleanupOldVTestNets(accessKey: string, accountSlug: string, projectSlug: string): Promise<number> {
  try {
    const listRes = await fetch(
      `${TENDERLY_API}/account/${accountSlug}/project/${projectSlug}/vnets`,
      { headers: { "X-Access-Key": accessKey, Accept: "application/json" } }
    );
    if (!listRes.ok) return 0;

    const vnets = await listRes.json() as Array<{ id: string; created_at: string; slug: string }>;
    if (vnets.length <= MAX_VNETS_TO_KEEP) return 0;

    // Sort by created_at descending (newest first), delete all beyond the keep limit
    const sorted = [...vnets].sort((a, b) => b.created_at.localeCompare(a.created_at));
    const toDelete = sorted.slice(MAX_VNETS_TO_KEEP);

    let deleted = 0;
    for (const vnet of toDelete) {
      const delRes = await fetch(
        `${TENDERLY_API}/account/${accountSlug}/project/${projectSlug}/vnets/${vnet.id}`,
        { method: "DELETE", headers: { "X-Access-Key": accessKey } }
      );
      if (delRes.ok || delRes.status === 204 || delRes.status === 404) deleted++;
    }
    console.log(`[OmniSentinel] Cleaned up ${deleted}/${toDelete.length} old VTestNets`);
    return deleted;
  } catch (err) {
    console.warn("VTestNet cleanup failed:", err);
    return 0;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const reason = body.reason ?? "block_limit_reached";

    const accessKey = process.env.TENDERLY_ACCESS_KEY;
    const accountSlug = process.env.TENDERLY_ACCOUNT_SLUG ?? "me";
    const projectSlug = process.env.TENDERLY_PROJECT_SLUG ?? "project";

    if (!accessKey) {
      return NextResponse.json(
        { error: "TENDERLY_ACCESS_KEY not configured" },
        { status: 500 }
      );
    }

    // Pre-flight: verify API key works before attempting rotation
    const authCheck = await fetch(
      `${TENDERLY_API}/account/${accountSlug}/project/${projectSlug}/vnets`,
      { headers: { "X-Access-Key": accessKey, Accept: "application/json" } }
    );
    if (authCheck.status === 401) {
      return NextResponse.json(
        { error: "Tenderly API key expired or invalid — generate a new key at dashboard.tenderly.co/account/authorization" },
        { status: 502 }
      );
    }
    if (authCheck.status === 403) {
      return NextResponse.json(
        { error: "Tenderly API key lacks permission for this project" },
        { status: 502 }
      );
    }

    // Clean up old VTestNets before creating a new one (frees quota)
    const cleaned = await cleanupOldVTestNets(accessKey, accountSlug, projectSlug);

    const slug = `omni-sentinel-${Date.now()}`;
    const displayName = `OmniSentinel VTestNet (rotated ${new Date().toISOString().slice(0, 16)})`;

    // Create a new Virtual TestNet forked from Sepolia at latest block
    const createRes = await fetch(
      `${TENDERLY_API}/account/${accountSlug}/project/${projectSlug}/vnets`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Access-Key": accessKey,
        },
        body: JSON.stringify({
          slug,
          display_name: displayName,
          fork_config: {
            network_id: 11155111, // Sepolia
            block_number: "latest",
          },
          virtual_network_config: {
            chain_config: {
              chain_id: 73571, // Keep same chain ID for seamless frontend compat
            },
          },
          sync_state_config: {
            enabled: false,
          },
          explorer_page_config: {
            enabled: true,
            verification_visibility: "bytecode",
          },
        }),
      }
    );

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error("Tenderly API error:", createRes.status, errText);
      const friendlyMsg = createRes.status === 401
        ? "Tenderly API key expired or invalid — generate a new key at dashboard.tenderly.co/account/authorization"
        : createRes.status === 403
        ? "Tenderly API key lacks permission — check project access settings"
        : createRes.status === 429
        ? "Tenderly rate limit hit — wait a minute and retry"
        : `Tenderly API returned ${createRes.status}`;
      return NextResponse.json(
        { error: friendlyMsg, details: errText },
        { status: 502 }
      );
    }

    const vnet = await createRes.json();

    // Extract RPC URLs from response
    const adminRpc = vnet.rpcs?.find((r: any) => r.name === "Admin RPC")?.url
      ?? vnet.rpcs?.[0]?.url;
    const publicRpc = vnet.rpcs?.find((r: any) => r.name === "Public RPC")?.url
      ?? vnet.rpcs?.[1]?.url
      ?? adminRpc;

    if (!adminRpc) {
      return NextResponse.json(
        { error: "No RPC URL in Tenderly response", raw: vnet },
        { status: 502 }
      );
    }

    // Fund the deployer address with ETH via the admin RPC faucet
    const deployerAddress = process.env.DEPLOYER_ADDRESS;
    if (deployerAddress && adminRpc) {
      await fetch(adminRpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tenderly_setBalance",
          params: [[deployerAddress], "0x56BC75E2D63100000"], // 100 ETH
          id: 1,
        }),
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      reason,
      vnet: {
        id: vnet.id,
        slug: vnet.slug,
        displayName: vnet.display_name,
        chainId: 73571,
        adminRpc,
        publicRpc,
        explorerUrl: vnet.explorer_page_url ?? null,
        createdAt: new Date().toISOString(),
      },
      cleanedUp: cleaned,
      note: "Old VTestNets auto-deleted to stay within quota. Update RPC URL in your environment to use the new VTestNet.",
    });
  } catch (error: any) {
    console.error("VTestNet rotation failed:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// GET: Check current VTestNet health / block height
export async function GET() {
  const rpcUrl = process.env.TENDERLY_VIRTUAL_TESTNET_RPC;

  if (!rpcUrl) {
    return NextResponse.json({ error: "No RPC URL configured" }, { status: 500 });
  }

  try {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
        id: 1,
      }),
    });

    const data = await res.json();
    const blockNumber = parseInt(data.result, 16);

    return NextResponse.json({
      rpcUrl: rpcUrl.replace(/\/[a-f0-9-]{36}$/, "/***"), // mask the ID
      blockNumber,
      blockNumberHex: data.result,
      healthy: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      healthy: false,
      error: error.message,
      needsRotation: true,
    });
  }
}
