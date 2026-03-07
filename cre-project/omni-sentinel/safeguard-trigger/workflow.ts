/**
 * CRE Workflow 3: SafeguardTrigger
 *
 * Trigger: Cron (every 1 minute)
 * Purpose: Read onchain risk scores from RiskOracle. If risk exceeds threshold,
 *          trigger circuit breaker on SafeguardController contract.
 *
 * Tracks: Risk & Compliance
 */

import {
  cre,
  type CronPayload,
  type Runtime,
  getNetwork,
  LAST_FINALIZED_BLOCK_NUMBER,
  encodeCallMsg,
  prepareReportRequest,
  bytesToHex,
} from "@chainlink/cre-sdk";
import {
  type Address,
  encodeFunctionData,
  decodeFunctionResult,
  zeroAddress,
} from "viem";
import { z } from "zod";

export const configSchema = z.object({
  schedule: z.string(),
  evms: z.array(
    z.object({
      chainSelectorName: z.string(),
      riskOracleAddress: z.string(),
      safeguardControllerAddress: z.string(),
      gasLimit: z.string(),
    })
  ),
  riskThreshold: z.number(),
});

type Config = z.infer<typeof configSchema>;

// RiskOracle ABI — getLatestRiskScore view function
const RiskOracleABI = [
  {
    name: "getLatestRiskScore",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "score", type: "uint256" },
      { name: "timestamp", type: "uint256" },
    ],
  },
] as const;

// SafeguardController ABI — onReport
const SafeguardControllerABI = [
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

export const onCronCheck = (
  runtime: Runtime<Config>,
  payload: CronPayload
): string => {
  if (!payload.scheduledExecutionTime) {
    throw new Error("Scheduled execution time is required");
  }

  runtime.log("Running SafeguardTrigger CronCheck");

  const config = runtime.config;
  const chainConfig = config.evms[0];

  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: chainConfig.chainSelectorName,
    isTestnet: true,
  });

  if (!network) {
    throw new Error(
      `Network not found for chain: ${chainConfig.chainSelectorName}`
    );
  }

  const evmClient = new cre.capabilities.EVMClient(
    network.chainSelector.selector
  );

  // Step 1: Read current risk score from RiskOracle
  const callData = encodeFunctionData({
    abi: RiskOracleABI,
    functionName: "getLatestRiskScore",
  });

  const readResult = evmClient
    .callContract(runtime, {
      call: encodeCallMsg({
        from: zeroAddress,
        to: chainConfig.riskOracleAddress as Address,
        data: callData,
      }),
      blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
    })
    .result();

  // Step 2: Decode the response
  const decoded = decodeFunctionResult({
    abi: RiskOracleABI,
    functionName: "getLatestRiskScore",
    data: bytesToHex(readResult.data),
  }) as [bigint, bigint];

  const riskScore = Number(decoded[0]);
  const timestamp = decoded[1];

  runtime.log(`Current risk score: ${riskScore}, threshold: ${config.riskThreshold}`);

  // Step 3: If risk exceeds threshold, trigger safeguard
  if (riskScore > config.riskThreshold) {
    const action = riskScore > 90 ? 2 : riskScore > 75 ? 1 : 0;
    // 0 = PAUSE, 1 = LIMIT, 2 = EMERGENCY

    runtime.log(
      `ALERT: Risk ${riskScore} exceeds threshold ${config.riskThreshold}. Triggering action ${action}`
    );

    // Encode onReport call
    const reportData =
      "0x" +
      BigInt(riskScore).toString(16).padStart(64, "0") +
      BigInt(timestamp.toString()).toString(16).padStart(64, "0") +
      BigInt(action).toString(16).padStart(64, "0");

    const onReportCallData = encodeFunctionData({
      abi: SafeguardControllerABI,
      functionName: "onReport",
      args: [
        "0x" as `0x${string}`,
        reportData as `0x${string}`,
      ],
    });

    // Create signed report
    const reportResponse = runtime
      .report(prepareReportRequest(onReportCallData))
      .result();

    // Write onchain
    const writeResult = evmClient
      .writeReport(runtime, {
        receiver: chainConfig.safeguardControllerAddress as Address,
        report: reportResponse,
        gasConfig: { gasLimit: chainConfig.gasLimit },
      })
      .result();

    runtime.log(
      `Safeguard triggered. TX status: ${writeResult.txStatus}`
    );

    return `TRIGGERED:${action}`;
  }

  runtime.log("Risk within safe range. No action needed.");
  return "OK";
};

export function initWorkflow(config: Config) {
  const cronTrigger = new cre.capabilities.CronCapability();

  return [
    cre.handler(
      cronTrigger.trigger({
        schedule: config.schedule,
      }),
      onCronCheck
    ),
  ];
}
