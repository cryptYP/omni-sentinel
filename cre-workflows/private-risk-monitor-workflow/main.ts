/**
 * CRE Workflow 4: PrivateRiskMonitor
 *
 * Trigger: Cron (every 10 minutes)
 * Purpose: Fetch sensitive portfolio risk data using Chainlink Confidential HTTP
 *          to protect API credentials and response data from node operators.
 *          Aggregates private risk signals without exposing individual positions.
 *
 * Tracks: Privacy (Chainlink Confidential Compute)
 *
 * Uses: ConfidentialHTTP capability to make API calls where request/response
 *       data is encrypted and inaccessible to DON node operators.
 *
 * Reference: https://docs.chain.link/cre/reference/capabilities/confidential-http
 */

import { Runner } from "@chainlink/cre-sdk";
import { z } from "zod";
import {
  cre,
  CronCapability,
  ConfidentialHTTPClient,
  consensusMedianAggregation,
} from "@chainlink/cre-sdk";
import type { Runtime, NodeRuntime } from "@chainlink/cre-sdk";
import { encodeAbiParameters } from "viem";

// --- Config Schema ---
const configSchema = z.object({
  schedule: z.string(),
  privateApiUrl: z.string(),
  evms: z.array(
    z.object({
      chainSelectorName: z.string(),
      riskOracleContractAddress: z.string(),
    })
  ),
  gasLimit: z.number(),
});

type Config = z.infer<typeof configSchema>;

// --- Workflow Definition ---
const workflow = cre.workflow({
  name: "private-risk-monitor",
  configSchema,
})
  .addTrigger(CronCapability, (config: Config) => ({
    schedule: config.schedule,
  }))
  .addNode("fetch_private_data", ConfidentialHTTPClient.request, (config: Config) => ({
    // Confidential HTTP: API key and response data are encrypted
    // Node operators cannot see the request credentials or response body
    url: config.privateApiUrl,
    method: "GET",
    headers: {
      // API key is stored as a CRE secret and encrypted in transit
      "Authorization": `Bearer ${cre.getSecret("PRIVATE_DATA_API_KEY")}`,
      "Content-Type": "application/json",
    },
    // Response is decrypted only inside the TEE (Trusted Execution Environment)
    // ensuring privacy of sensitive portfolio/position data
  }))
  .addNode("compute_private_risk", async (runtime: NodeRuntime, inputs: { fetch_private_data: any }) => {
    // Parse the confidential response inside the secure enclave
    const data = JSON.parse(inputs.fetch_private_data.body);

    // Compute aggregate risk score from private data
    // Individual position data never leaves the TEE
    const exposureScore = data.totalExposure ? Math.min(100, (data.totalExposure / 1e9) * 20) : 50;
    const concentrationRisk = data.topPositionPct ? data.topPositionPct * 0.8 : 30;
    const liquidityRisk = data.avgLiquidity ? Math.max(0, 100 - data.avgLiquidity) : 40;

    // Only the aggregate score is published — not the underlying data
    const privateRiskScore = Math.round(
      exposureScore * 0.4 + concentrationRisk * 0.35 + liquidityRisk * 0.25
    );

    return {
      score: Math.min(100, Math.max(0, privateRiskScore)),
      timestamp: Math.floor(Date.now() / 1000),
      // protocolId for "private-aggregate" — no individual protocol data exposed
      protocolId: "0x" + Buffer.from("private-aggregate").toString("hex").padEnd(64, "0"),
    };
  })
  .setConsensus(consensusMedianAggregation, {
    // Median aggregation across DON nodes ensures no single node
    // can manipulate the private risk score
    fields: ["score"],
  })
  .addTarget((config: Config) => ({
    evms: config.evms.map((evm) => ({
      chainSelectorName: evm.chainSelectorName,
      contractAddress: evm.riskOracleContractAddress,
      gasLimit: config.gasLimit,
      abiEncodedReport: (result: any) =>
        encodeAbiParameters(
          [
            { type: "uint256", name: "riskScore" },
            { type: "uint256", name: "timestamp" },
            { type: "bytes32", name: "protocolId" },
          ],
          [BigInt(result.score), BigInt(result.timestamp), result.protocolId as `0x${string}`]
        ),
    })),
  }));

// --- Runner ---
const runner = new Runner(workflow);
runner.run();
