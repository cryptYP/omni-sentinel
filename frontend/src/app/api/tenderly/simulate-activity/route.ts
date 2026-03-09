/**
 * Simulated Multi-User Activity — /api/tenderly/simulate-activity
 *
 * Creates fake wallets that place bets on prediction markets to simulate
 * a multi-user platform. Each simulated user gets funded, verified, and
 * places a random YES/NO position. This creates real on-chain transactions
 * on the Tenderly VTestNet.
 *
 * Sponsors: Tenderly Virtual TestNets, World ID
 */
import { NextResponse } from "next/server";

const PREDICTION_MARKET = process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS!;
const DEPLOYER = process.env.DEPLOYER_ADDRESS ?? "0x0Ede4d8D26A2626b5Fd0Ecdde621AB824288b490";

// Function selectors
const SET_VERIFIED_SEL = "c8c75647";  // setVerified(address)
const TAKE_POSITION_SEL = "f1f374bc"; // takePosition(uint256,bool)

// Simulated user wallets (deterministic for reproducibility)
const SIM_WALLETS = [
  "0xA1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0",
  "0xB2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0A1",
  "0xC3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0A1B2",
  "0xD4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0A1B2C3",
  "0xE5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0A1B2C3D4",
  "0xF6A7B8C9D0E1F2A3B4C5D6E7F8A9B0A1B2C3D4E5",
  "0xA7B8C9D0E1F2A3B4C5D6E7F8A9B0A1B2C3D4E5F6",
  "0xB8C9D0E1F2A3B4C5D6E7F8A9B0A1B2C3D4E5F6A7",
];

function encodeUint256(n: number | bigint): string {
  return BigInt(n).toString(16).padStart(64, "0");
}

function pad64Address(addr: string): string {
  return addr.toLowerCase().replace("0x", "").padStart(64, "0");
}

async function rpc(url: string, method: string, params: any[]) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
  });
  return res.json();
}

export async function POST(req: Request) {
  try {
    const { marketId, numUsers = 4 } = await req.json();

    const rpcUrl = process.env.TENDERLY_VIRTUAL_TESTNET_RPC;
    if (!rpcUrl) {
      return NextResponse.json({ error: "RPC not configured" }, { status: 500 });
    }

    const count = Math.min(numUsers, SIM_WALLETS.length);
    const results: any[] = [];

    for (let i = 0; i < count; i++) {
      const wallet = SIM_WALLETS[i];

      // 1. Fund the simulated wallet with 10 ETH
      await rpc(rpcUrl, "tenderly_setBalance", [[wallet], "0x8AC7230489E80000"]);

      // 2. Verify the wallet (setVerified from deployer)
      const verifyData = "0x" + SET_VERIFIED_SEL + pad64Address(wallet);
      await rpc(rpcUrl, "eth_sendTransaction", [{
        from: DEPLOYER,
        to: PREDICTION_MARKET,
        data: verifyData,
        gas: "0x30000",
      }]);

      // 3. Place a random bet (pseudo-random based on wallet + marketId)
      const seed = parseInt(wallet.slice(2, 10), 16) + (marketId ?? 0);
      const isYes = seed % 3 !== 0; // ~67% YES bias (realistic)
      const betAmounts = [0.05, 0.1, 0.15, 0.2, 0.3, 0.5, 0.75, 1.0];
      const betEth = betAmounts[seed % betAmounts.length];
      const betWei = BigInt(Math.floor(betEth * 1e18));

      const betData = "0x" + TAKE_POSITION_SEL +
        encodeUint256(marketId ?? 0) +
        encodeUint256(isYes ? 1 : 0);

      const betResult = await rpc(rpcUrl, "eth_sendTransaction", [{
        from: wallet,
        to: PREDICTION_MARKET,
        data: betData,
        value: "0x" + betWei.toString(16),
        gas: "0x50000",
      }]);

      results.push({
        wallet: wallet.slice(0, 10) + "...",
        side: isYes ? "YES" : "NO",
        amount: betEth + " ETH",
        txHash: betResult.result ?? null,
        error: betResult.error?.message ?? null,
      });
    }

    return NextResponse.json({
      success: true,
      marketId,
      simulated: results,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
