/**
 * CRE Workflow 3: SafeguardTrigger
 *
 * Trigger: Cron (every 1 minute)
 * Purpose: Read onchain risk scores from RiskOracle. If risk exceeds threshold,
 *          trigger circuit breaker on SafeguardController contract.
 *
 * Tracks: Risk & Compliance
 *
 * Reference: https://docs.chain.link/cre/guides/workflow/using-evm-client/onchain-write/overview-ts
 */

import { Runner } from "@chainlink/cre-sdk";
import { z } from "zod";
import {
  cre,
  CronCapability,
  LAST_FINALIZED_BLOCK_NUMBER,
  encodeCallMsg,
} from "@chainlink/cre-sdk";
import type { Runtime } from "@chainlink/cre-sdk";
import {
  encodeFunctionData,
  decodeFunctionResult,
  encodeAbiParameters,
  zeroAddress,
} from "viem";

// --- Config Schema ---
const configSchema = z.object({
  schedule: z.string(),
  evms: z.array(
    z.object({
      chainSelectorName: z.string(),
      riskOracleAddress: z.string(),
      safeguardControllerAddress: z.string(),
    })
  ),
  riskThreshold: z.number(),
  gasLimit: z.number(),
});

type Config = z.infer<typeof configSchema>;

// --- ABI for RiskOracle.getLatestRiskScore() ---
const RISK_ORACLE_ABI = [
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

// --- Workflow Initialization ---
function initWorkflow(config: Config) {
  const cronTrigger = CronCapability.trigger({
    schedule: config.schedule,
  });

  return [cre.handler(cronTrigger, onCronCheck)];
}

// --- Main Callback ---
function onCronCheck(runtime: Runtime<Config>): void {
  const config = runtime.config;
  const chainConfig = config.evms[0];

  const evmClient = new cre.capabilities.EVMClient(
    cre.getNetwork(chainConfig.chainSelectorName)
  );

  // Step 1: Read current risk score from RiskOracle
  const callData = encodeFunctionData({
    abi: RISK_ORACLE_ABI,
    functionName: "getLatestRiskScore",
  });

  const readResult = evmClient
    .callContract(runtime, {
      call: encodeCallMsg({
        from: zeroAddress,
        to: chainConfig.riskOracleAddress as `0x${string}`,
        data: callData,
      }),
      blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
    })
    .result();

  // Step 2: Decode the response
  const [score, timestamp] = decodeFunctionResult({
    abi: RISK_ORACLE_ABI,
    functionName: "getLatestRiskScore",
    data: readResult.data as `0x${string}`,
  }) as [bigint, bigint];

  const riskScore = Number(score);

  // Step 3: If risk exceeds threshold, trigger safeguard
  if (riskScore > config.riskThreshold) {
    // Determine action severity
    const action = riskScore > 90 ? 2 : riskScore > 75 ? 1 : 0;
    // 0 = PAUSE, 1 = LIMIT, 2 = EMERGENCY

    const safeguardData = encodeAbiParameters(
      [
        {
          type: "tuple",
          components: [
            { name: "riskScore", type: "uint256" },
            { name: "triggerTimestamp", type: "uint256" },
            { name: "action", type: "uint8" },
          ],
        },
      ],
      [
        {
          riskScore: BigInt(riskScore),
          triggerTimestamp: timestamp,
          action,
        },
      ]
    );

    // Generate signed report
    const report = runtime.report(
      safeguardData,
      chainConfig.safeguardControllerAddress
    );

    // Write onchain
    evmClient.writeReport(runtime, {
      report: report.result(),
      contractAddress: chainConfig.safeguardControllerAddress,
      gasLimit: config.gasLimit,
    });
  }
}

// --- Entry Point ---
export async function main() {
  const runner = await Runner.newRunner<Config>({ configSchema });
  await runner.run(initWorkflow);
}

main();
