/**
 * CRE Workflow 1: RiskMonitor
 *
 * Trigger: Cron (every 5 minutes)
 * Purpose: Fetch DeFi protocol health data from DeFi Llama,
 *          send to Gemini AI for risk analysis,
 *          write risk score onchain to RiskOracle contract.
 *
 * Tracks: Risk & Compliance, CRE & AI, DeFi & Tokenization
 *
 * Reference: https://docs.chain.link/cre/reference/sdk/core-ts
 */

import { Runner } from "@chainlink/cre-sdk";
import { z } from "zod";
import {
  cre,
  CronCapability,
  HTTPClient,
  consensusMedianAggregation,
} from "@chainlink/cre-sdk";
import type { Runtime, NodeRuntime } from "@chainlink/cre-sdk";
import { encodeAbiParameters } from "viem";

// --- Config Schema ---
const configSchema = z.object({
  schedule: z.string(),
  geminiApiUrl: z.string(),
  defiLlamaApiUrl: z.string(),
  evms: z.array(
    z.object({
      chainSelectorName: z.string(),
      riskOracleContractAddress: z.string(),
    })
  ),
  gasLimit: z.number(),
});

type Config = z.infer<typeof configSchema>;

// --- Workflow Initialization ---
function initWorkflow(config: Config) {
  const cronTrigger = CronCapability.trigger({
    schedule: config.schedule,
  });

  return [cre.handler(cronTrigger, onCronTrigger)];
}

// --- Main Callback ---
function onCronTrigger(runtime: Runtime<Config>): void {
  const config = runtime.config;

  // Step 1: Fetch protocol data (each node independently, then consensus)
  const protocolData = runtime.runInNodeMode(
    fetchProtocolData,
    consensusMedianAggregation
  );

  // Step 2: AI risk analysis (each node independently, then consensus on score)
  const riskAnalysis = runtime.runInNodeMode(
    (nodeRuntime: NodeRuntime<Config>) =>
      analyzeWithAI(nodeRuntime, protocolData.result()),
    consensusMedianAggregation
  );

  // Step 3: Encode risk score for onchain delivery
  const riskScore = riskAnalysis.result();
  const encodedReport = encodeRiskScore(riskScore);

  // Step 4: Generate signed report
  const report = runtime.report(
    encodedReport,
    config.evms[0].riskOracleContractAddress
  );

  // Step 5: Write onchain via EVM Client
  const evmClient = new cre.capabilities.EVMClient(
    cre.getNetwork(config.evms[0].chainSelectorName)
  );

  evmClient.writeReport(runtime, {
    report: report.result(),
    contractAddress: config.evms[0].riskOracleContractAddress,
    gasLimit: config.gasLimit,
  });
}

// --- Node-Level: Fetch Protocol Data ---
async function fetchProtocolData(
  nodeRuntime: NodeRuntime<Config>
): Promise<number> {
  const httpClient = new HTTPClient();

  const response = httpClient.fetch(nodeRuntime, {
    url: nodeRuntime.config.defiLlamaApiUrl,
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const data = JSON.parse(response.result().body);

  // Return TVL as a number for consensus aggregation
  return typeof data === "number" ? data : (data.tvl ?? 0);
}

// --- Node-Level: AI Risk Analysis ---
async function analyzeWithAI(
  nodeRuntime: NodeRuntime<Config>,
  protocolTvl: number
): Promise<number> {
  const httpClient = new HTTPClient();
  const apiKey = nodeRuntime.getSecret("GEMINI_API_KEY");

  const payload = JSON.stringify({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `You are a DeFi risk analyst. Analyze the following protocol data and return ONLY a JSON object with a "riskScore" field (integer 0-100, where 100 is highest risk) and a "reasoning" field (string).

Protocol TVL: $${protocolTvl.toLocaleString()}
Timestamp: ${new Date().toISOString()}

Consider: TVL volatility indicators, protocol complexity, smart contract maturity, current market conditions.

Return ONLY valid JSON, no markdown formatting.`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 500,
    },
  });

  const response = httpClient.fetch(nodeRuntime, {
    url: `${nodeRuntime.config.geminiApiUrl}?key=${apiKey}`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
  });

  const result = JSON.parse(response.result().body);
  const aiText = result.candidates[0].content.parts[0].text;

  // Parse the AI response — handle potential markdown wrapping
  const cleaned = aiText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const aiResponse = JSON.parse(cleaned);

  return Math.min(100, Math.max(0, Math.round(aiResponse.riskScore)));
}

// --- Encode Risk Score for ABI ---
function encodeRiskScore(score: number): `0x${string}` {
  return encodeAbiParameters(
    [
      {
        type: "tuple",
        components: [
          { name: "riskScore", type: "uint256" },
          { name: "timestamp", type: "uint256" },
          { name: "protocolId", type: "bytes32" },
        ],
      },
    ],
    [
      {
        riskScore: BigInt(score),
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
        protocolId:
          "0x0000000000000000000000000000000000000000000000000000000000000001" as `0x${string}`,
      },
    ]
  );
}

// --- Entry Point ---
export async function main() {
  const runner = await Runner.newRunner<Config>({ configSchema });
  await runner.run(initWorkflow);
}

main();
