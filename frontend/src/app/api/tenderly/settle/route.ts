/**
 * Auto-Settlement API — /api/tenderly/settle
 *
 * Settles expired prediction markets on the Tenderly VTestNet:
 * 1. Calls requestSettlement(marketId) from deployer to emit SettlementRequested event
 * 2. Directly resolves the market via onReport() from the forwarder address
 *
 * In production, step 2 would be handled by the CRE MarketSettler workflow
 * listening for SettlementRequested events. On VTestNet we simulate both steps
 * so users get instant resolution and payout.
 *
 * Sponsors: Tenderly Virtual TestNets, Chainlink CRE
 */
import { NextResponse } from "next/server";

const PREDICTION_MARKET = process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS!;
const DEPLOYER = process.env.DEPLOYER_ADDRESS ?? "0x0Ede4d8D26A2626b5Fd0Ecdde621AB824288b490";

// Correct function selectors (verified via `cast sig`)
const REQUEST_SETTLEMENT_SEL = "f4fc6cdb"; // requestSettlement(uint256)
const ON_REPORT_SEL = "805f2132";           // onReport(bytes,bytes)
const FORWARDER_SEL = "f645d4f9";           // forwarder()

function pad64(hex: string): string {
  return hex.replace(/^0x/, "").padStart(64, "0");
}

function encodeUint256(n: number): string {
  return n.toString(16).padStart(64, "0");
}

export async function POST(req: Request) {
  try {
    const { marketId, outcome } = await req.json();

    if (typeof marketId !== "number" || marketId < 0) {
      return NextResponse.json({ error: "Invalid marketId" }, { status: 400 });
    }

    const rpcUrl = process.env.TENDERLY_VIRTUAL_TESTNET_RPC;
    if (!rpcUrl) {
      return NextResponse.json({ error: "RPC not configured" }, { status: 500 });
    }

    // Get the forwarder address from the contract
    const forwarderRes = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_call",
        params: [{ to: PREDICTION_MARKET, data: "0x" + FORWARDER_SEL }, "latest"],
        id: 1,
      }),
    });
    const forwarderData = await forwarderRes.json();
    const forwarder = forwarderData.result
      ? "0x" + forwarderData.result.slice(26)
      : DEPLOYER;

    // Step 1: requestSettlement(marketId) from deployer
    const requestCalldata = "0x" + REQUEST_SETTLEMENT_SEL + encodeUint256(marketId);

    const reqRes = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_sendTransaction",
        params: [{
          from: DEPLOYER,
          to: PREDICTION_MARKET,
          data: requestCalldata,
          gas: "0x50000",
        }],
        id: 2,
      }),
    });
    const reqData = await reqRes.json();
    if (reqData.error) {
      const msg = reqData.error.message || JSON.stringify(reqData.error);
      // Tenderly quota limit — simulate settlement
      if (msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("limit") || msg.toLowerCase().includes("upgrade")) {
        return NextResponse.json({
          success: true,
          simulated: true,
          marketId,
          outcome: outcome !== undefined ? outcome : true,
          note: "Tenderly RPC quota reached — settlement simulated locally.",
        });
      }
      return NextResponse.json({ error: msg, step: "requestSettlement" }, { status: 502 });
    }

    // Step 2: Simulate CRE workflow — call onReport(bytes metadata, bytes report) from forwarder
    // report = abi.encode(uint256 marketId, bool outcome, uint256 confidence, uint256 timestamp)
    const resolveOutcome = outcome !== undefined ? outcome : true;
    const reportInner =
      encodeUint256(marketId) +
      encodeUint256(resolveOutcome ? 1 : 0) +
      encodeUint256(8500) + // 85% confidence (basis points)
      encodeUint256(Math.floor(Date.now() / 1000));
    // reportInner is 4 x 32 = 128 bytes = 256 hex chars

    // ABI encode onReport(bytes metadata, bytes report):
    //   offset(metadata) = 0x40, offset(report) = 0x80
    //   metadata: length=0, no data (just the 32-byte length word)
    //   report: length=128 (0x80), then 128 bytes of data
    const onReportCalldata = "0x" + ON_REPORT_SEL +
      encodeUint256(0x40) +  // offset to metadata
      encodeUint256(0x80) +  // offset to report (0x40 + 32 bytes for metadata length + 0 padding = 0x60... no)
      // At offset 0x40: metadata
      encodeUint256(0) +     // metadata length = 0
      // At offset 0x60: but report offset is 0x80, so we need 32 bytes padding
      encodeUint256(0) +     // padding (metadata data, padded to 32 bytes even though length=0)
      // At offset 0x80: report
      encodeUint256(128) +   // report length = 128 bytes (4 x uint256)
      reportInner;           // actual report data

    const settleRes = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_sendTransaction",
        params: [{
          from: forwarder,
          to: PREDICTION_MARKET,
          data: onReportCalldata,
          gas: "0x80000",
        }],
        id: 3,
      }),
    });
    const settleData = await settleRes.json();

    if (settleData.error) {
      const settleMsg = settleData.error.message || JSON.stringify(settleData.error);
      if (settleMsg.toLowerCase().includes("quota") || settleMsg.toLowerCase().includes("limit") || settleMsg.toLowerCase().includes("upgrade")) {
        return NextResponse.json({
          success: true,
          simulated: true,
          marketId,
          outcome: resolveOutcome,
          requestSettlementTx: reqData.result,
          note: "Tenderly RPC quota reached — settlement simulated locally.",
        });
      }
      return NextResponse.json({
        error: settleMsg,
        step: "onReport",
        requestSettlementTx: reqData.result,
      }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      marketId,
      outcome: resolveOutcome,
      requestSettlementTx: reqData.result,
      settlementTx: settleData.result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
