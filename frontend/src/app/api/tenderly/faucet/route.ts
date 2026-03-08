/**
 * Tenderly VTestNet Faucet API — /api/tenderly/faucet
 *
 * Funds any wallet address with 10 ETH on the Tenderly VTestNet
 * using the Admin RPC tenderly_setBalance method. This enables
 * users to interact with prediction markets without needing
 * external faucets.
 *
 * Sponsors: Tenderly Virtual TestNets
 */
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { address, ethHex } = await req.json();

    if (!address || typeof address !== "string" || !address.startsWith("0x")) {
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }

    const rpcUrl = process.env.TENDERLY_VIRTUAL_TESTNET_RPC;
    if (!rpcUrl) {
      return NextResponse.json({ error: "RPC not configured" }, { status: 500 });
    }

    // Allowed amounts: 10 ETH, 100 ETH, 1000 ETH
    const allowedAmounts: Record<string, string> = {
      "0x8AC7230489E80000": "10 ETH",
      "0x56BC75E2D63100000": "100 ETH",
      "0x3635C9ADC5DEA00000": "1000 ETH",
    };
    const amountHex = ethHex && allowedAmounts[ethHex] ? ethHex : "0x8AC7230489E80000";
    const amountLabel = allowedAmounts[amountHex];

    // Use tenderly_addBalance to ADD to existing balance (not replace)
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tenderly_addBalance",
        params: [[address], amountHex],
        id: 1,
      }),
    });

    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      address,
      amount: amountLabel,
      txHash: data.result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
