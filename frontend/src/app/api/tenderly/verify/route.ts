/**
 * On-Chain World ID Verification API — /api/tenderly/verify
 *
 * Calls PredictionMarket.setVerified(address) on the Tenderly VTestNet
 * using the deployer (owner) account via Admin RPC eth_sendTransaction.
 * This marks the user's wallet as World ID verified on-chain so they
 * can call takePosition() on prediction markets.
 *
 * Sponsors: Tenderly Virtual TestNets, World ID
 */
import { NextResponse } from "next/server";

const PREDICTION_MARKET = process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS!;
const DEPLOYER = process.env.DEPLOYER_ADDRESS ?? "0x0Ede4d8D26A2626b5Fd0Ecdde621AB824288b490";

// setVerified(address) selector = 0xc8c75647
const SET_VERIFIED_SELECTOR = "c8c75647";

export async function POST(req: Request) {
  try {
    const { address } = await req.json();

    if (!address || typeof address !== "string" || !address.startsWith("0x")) {
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }

    const rpcUrl = process.env.TENDERLY_VIRTUAL_TESTNET_RPC;
    if (!rpcUrl) {
      return NextResponse.json({ error: "RPC not configured" }, { status: 500 });
    }

    // Encode: setVerified(address) with ABI-encoded address parameter
    const paddedAddress = address.toLowerCase().replace("0x", "").padStart(64, "0");
    const calldata = "0x" + SET_VERIFIED_SELECTOR + paddedAddress;

    // Send unsigned tx from deployer (owner) via Admin RPC
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_sendTransaction",
        params: [{
          from: DEPLOYER,
          to: PREDICTION_MARKET,
          data: calldata,
          gas: "0x30000",
        }],
        id: 1,
      }),
    });

    const data = await res.json();

    if (data.error) {
      console.error("setVerified failed:", data.error);
      return NextResponse.json({ error: data.error.message }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      address,
      txHash: data.result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
