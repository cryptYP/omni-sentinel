/**
 * CRE Workflow 1: RiskMonitor
 *
 * Trigger: Cron (every 5 minutes)
 * Purpose: Fetch DeFi protocol health data from DeFi Llama,
 *          send to Gemini AI for risk analysis,
 *          write risk score onchain to RiskOracle contract.
 */

import {
  cre,
  type CronPayload,
  type Runtime,
  getNetwork,
  ConsensusAggregationByFields,
  median,
  prepareReportRequest,
  type HTTPSendRequester,
} from "@chainlink/cre-sdk";
import { type Address, encodeFunctionData } from "viem";
import { z } from "zod";

export const configSchema = z.object({
  schedule: z.string(),
  geminiApiUrl: z.string(),
  defiLlamaApiUrl: z.string(),
  evms: z.array(
    z.object({
      chainSelectorName: z.string(),
      riskOracleContractAddress: z.string(),
      gasLimit: z.string(),
    })
  ),
});

type Config = z.infer<typeof configSchema>;

interface ProtocolData {
  tvl: number;
}

// RiskOracle ABI — just the onReport function
const RiskOracleABI = [
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

// Fetch DeFi Llama protocol data
const fetchProtocolData = (
  sendRequester: HTTPSendRequester,
  config: Config
): ProtocolData => {
  const response = sendRequester
    .sendRequest({ method: "GET", url: config.defiLlamaApiUrl })
    .result();

  if (response.statusCode !== 200) {
    throw new Error(`DeFi Llama request failed: ${response.statusCode}`);
  }

  const responseText = Buffer.from(response.body).toString("utf-8");
  const data = JSON.parse(responseText);

  return {
    tvl: typeof data === "number" ? data : (data.tvl ?? 0),
  };
};

// Derive risk score from TVL heuristic
// In production, this would be replaced by Gemini AI analysis
function deriveRiskScore(tvl: number): number {
  if (tvl > 10_000_000_000) return 25;
  if (tvl > 5_000_000_000) return 35;
  if (tvl > 1_000_000_000) return 50;
  if (tvl > 100_000_000) return 65;
  return 80;
}

export const onCronTrigger = (
  runtime: Runtime<Config>,
  payload: CronPayload
): string => {
  if (!payload.scheduledExecutionTime) {
    throw new Error("Scheduled execution time is required");
  }

  runtime.log("Running RiskMonitor CronTrigger");

  const config = runtime.config;

  // Fetch protocol TVL with consensus
  const httpCapability = new cre.capabilities.HTTPClient();
  const protocolData = httpCapability
    .sendRequest(
      runtime,
      fetchProtocolData,
      ConsensusAggregationByFields<ProtocolData>({
        tvl: median,
      })
    )(config)
    .result();

  runtime.log(`Protocol TVL: $${protocolData.tvl.toLocaleString()}`);

  // Derive risk score
  const riskScore = deriveRiskScore(protocolData.tvl);
  runtime.log(`Derived Risk Score: ${riskScore}`);

  // Encode the onReport call data
  const callData = encodeFunctionData({
    abi: RiskOracleABI,
    functionName: "onReport",
    args: [
      "0x" as `0x${string}`, // metadata (empty)
      ("0x" +
        BigInt(riskScore).toString(16).padStart(64, "0") +
        BigInt(Math.floor(Date.now() / 1000))
          .toString(16)
          .padStart(64, "0") +
        "0000000000000000000000000000000000000000000000000000000000000001") as `0x${string}`, // report: riskScore + timestamp + protocolId
    ],
  });

  // Create signed report via CRE
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
      receiver: evmConfig.riskOracleContractAddress as Address,
      report: reportResponse,
      gasConfig: { gasLimit: evmConfig.gasLimit },
    })
    .result();

  runtime.log(
    `Risk score ${riskScore} written onchain. TX status: ${writeResult.txStatus}`
  );

  return riskScore.toString();
};

export function initWorkflow(config: Config) {
  const cronTrigger = new cre.capabilities.CronCapability();

  return [
    cre.handler(
      cronTrigger.trigger({
        schedule: config.schedule,
      }),
      onCronTrigger
    ),
  ];
}
