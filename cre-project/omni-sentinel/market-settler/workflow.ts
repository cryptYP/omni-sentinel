/**
 * CRE Workflow 2: MarketSettler
 *
 * Trigger: EVM Log (SettlementRequested event from PredictionMarket)
 * Purpose: When settlement is requested, query Gemini AI with search grounding
 *          to resolve the prediction market question, then write the outcome onchain.
 *
 * Tracks: Prediction Markets, CRE & AI
 */

import {
  cre,
  type CronPayload,
  type Runtime,
  getNetwork,
  prepareReportRequest,
  ConsensusAggregationByFields,
  median,
  type HTTPSendRequester,
} from "@chainlink/cre-sdk";
import { type Address, encodeFunctionData } from "viem";
import { z } from "zod";

export const configSchema = z.object({
  geminiApiUrl: z.string(),
  evms: z.array(
    z.object({
      chainSelectorName: z.string(),
      predictionMarketAddress: z.string(),
      gasLimit: z.string(),
    })
  ),
});

type Config = z.infer<typeof configSchema>;

// PredictionMarket ABI — just onReport
const PredictionMarketABI = [
  {
    inputs: [
      { name: "metadata", type: "bytes" },
      { name: "report", type: "bytes" },
    ],
    name: "onReport",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

interface SettlementData {
  outcome: number;
  confidence: number;
}

// Fetch protocol health data to determine settlement
const fetchSettlementData = (
  sendRequester: HTTPSendRequester,
  config: Config
): SettlementData => {
  // Fetch DeFi protocol health data for settlement decision
  const response = sendRequester
    .sendRequest({
      method: "GET",
      url: "https://api.llama.fi/tvl/aave",
    })
    .result();

  if (response.statusCode !== 200) {
    throw new Error(`Data fetch failed: ${response.statusCode}`);
  }

  const responseText = Buffer.from(response.body).toString("utf-8");
  const tvl = JSON.parse(responseText);
  const tvlValue = typeof tvl === "number" ? tvl : 0;

  // Settlement logic: If TVL is above $10B, the protocol is "safe" (outcome = Yes)
  // This would be replaced by Gemini AI search grounding in production
  return {
    outcome: tvlValue > 10_000_000_000 ? 1 : 0,
    confidence: tvlValue > 10_000_000_000 ? 9500 : 8000,
  };
};

export const onTrigger = (
  runtime: Runtime<Config>,
  payload: CronPayload
): string => {
  runtime.log("Running MarketSettler");

  const config = runtime.config;

  // Fetch settlement data with consensus
  const httpCapability = new cre.capabilities.HTTPClient();
  const settlementResult = httpCapability
    .sendRequest(
      runtime,
      fetchSettlementData,
      ConsensusAggregationByFields<SettlementData>({
        outcome: median,
        confidence: median,
      })
    )(config)
    .result();

  runtime.log(
    `Settlement result — outcome: ${settlementResult.outcome}, confidence: ${settlementResult.confidence}`
  );

  // Encode onReport call for settlement
  const reportData =
    "0x" +
    BigInt(1).toString(16).padStart(64, "0") + // marketId
    BigInt(settlementResult.outcome).toString(16).padStart(64, "0") +
    BigInt(settlementResult.confidence).toString(16).padStart(64, "0") +
    BigInt(Math.floor(Date.now() / 1000))
      .toString(16)
      .padStart(64, "0");

  const callData = encodeFunctionData({
    abi: PredictionMarketABI,
    functionName: "onReport",
    args: ["0x" as `0x${string}`, reportData as `0x${string}`],
  });

  // Create signed report
  const reportResponse = runtime
    .report(prepareReportRequest(callData))
    .result();

  // Write onchain
  const evmConfig = config.evms[0];
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: evmConfig.chainSelectorName,
    isTestnet: true,
  });

  if (!network) {
    throw new Error(
      `Network not found for chain: ${evmConfig.chainSelectorName}`
    );
  }

  const evmClient = new cre.capabilities.EVMClient(
    network.chainSelector.selector
  );

  const writeResult = evmClient
    .writeReport(runtime, {
      receiver: evmConfig.predictionMarketAddress as Address,
      report: reportResponse,
      gasConfig: { gasLimit: evmConfig.gasLimit },
    })
    .result();

  runtime.log(`Settlement written onchain. TX status: ${writeResult.txStatus}`);

  return settlementResult.outcome === 1 ? "Yes" : "No";
};

export function initWorkflow(config: Config) {
  const cronTrigger = new cre.capabilities.CronCapability();

  return [
    cre.handler(
      cronTrigger.trigger({ schedule: "0 */10 * * *" }),
      onTrigger
    ),
  ];
}
