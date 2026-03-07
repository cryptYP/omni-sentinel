/**
 * CRE Workflow 2: MarketSettler
 *
 * Trigger: EVM Log (SettlementRequested event from PredictionMarket)
 * Purpose: When settlement is requested, query Gemini AI with search grounding
 *          to resolve the prediction market question, then write the outcome onchain.
 *
 * Tracks: Prediction Markets, CRE & AI
 *
 * Reference: https://docs.chain.link/cre/reference/sdk/core-ts
 */

import { Runner } from "@chainlink/cre-sdk";
import { z } from "zod";
import {
  cre,
  HTTPClient,
  consensusIdenticalAggregation,
} from "@chainlink/cre-sdk";
import type { Runtime, NodeRuntime } from "@chainlink/cre-sdk";
import { encodeAbiParameters, decodeAbiParameters } from "viem";

// --- Config Schema ---
const configSchema = z.object({
  geminiApiUrl: z.string(),
  evms: z.array(
    z.object({
      chainSelectorName: z.string(),
      predictionMarketAddress: z.string(),
    })
  ),
  gasLimit: z.number(),
  logTrigger: z.object({
    contractAddress: z.string(),
    eventSignature: z.string(),
    chainSelectorName: z.string(),
  }),
});

type Config = z.infer<typeof configSchema>;

// --- Workflow Initialization ---
function initWorkflow(config: Config) {
  // EVM Log Trigger — listens for SettlementRequested(uint256,string,uint256)
  const logTrigger = cre.capabilities.EVMLogTrigger.trigger({
    contractAddress: config.logTrigger.contractAddress,
    eventSignature: config.logTrigger.eventSignature,
    chainSelectorName: config.logTrigger.chainSelectorName,
  });

  return [cre.handler(logTrigger, onSettlementRequested)];
}

// --- Main Callback ---
function onSettlementRequested(runtime: Runtime<Config>): void {
  const config = runtime.config;
  const triggerData = runtime.triggerEvent;

  // Decode the event data
  // SettlementRequested(uint256 indexed marketId, string question, uint256 deadline)
  const marketId = triggerData.topics[1]; // indexed parameter
  const [question, deadline] = decodeAbiParameters(
    [
      { name: "question", type: "string" },
      { name: "deadline", type: "uint256" },
    ],
    triggerData.data as `0x${string}`
  );

  // Step 1: Query Gemini AI with search grounding for real-world verification
  const aiResult = runtime.runInNodeMode(
    (nodeRuntime: NodeRuntime<Config>) =>
      resolveWithAI(nodeRuntime, question as string, marketId as string),
    consensusIdenticalAggregation
  );

  // Step 2: Encode settlement
  const settlement = aiResult.result();
  const encodedSettlement = encodeSettlement(
    marketId as string,
    settlement.outcome,
    settlement.confidence
  );

  // Step 3: Generate signed report
  const report = runtime.report(
    encodedSettlement,
    config.evms[0].predictionMarketAddress
  );

  // Step 4: Write settlement onchain
  const evmClient = new cre.capabilities.EVMClient(
    cre.getNetwork(config.evms[0].chainSelectorName)
  );

  evmClient.writeReport(runtime, {
    report: report.result(),
    contractAddress: config.evms[0].predictionMarketAddress,
    gasLimit: config.gasLimit,
  });
}

// --- Node-Level: AI Resolution with Search Grounding ---
async function resolveWithAI(
  nodeRuntime: NodeRuntime<Config>,
  question: string,
  marketId: string
): Promise<{ outcome: string; confidence: number }> {
  const httpClient = new HTTPClient();
  const apiKey = nodeRuntime.getSecret("GEMINI_API_KEY");

  const payload = JSON.stringify({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `You are a fact-checking and event resolution system for DeFi prediction markets.

Determine the outcome of this market question based on factual, verifiable, real-world data:

Market ID: ${marketId}
Question: "${question}"

IMPORTANT:
- Search for real-world evidence to verify the claim
- Use current DeFi protocol data, TVL stats, and on-chain metrics
- Return ONLY a JSON object:
{
  "outcome": "Yes" or "No",
  "confidence": <number between 0.0 and 1.0>,
  "reasoning": "<brief explanation citing specific evidence>"
}

Return ONLY valid JSON, no markdown formatting.`,
          },
        ],
      },
    ],
    tools: [{ googleSearch: {} }], // Enable Gemini search grounding
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
  const cleaned = aiText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  return JSON.parse(cleaned);
}

// --- Encode Settlement for ABI ---
function encodeSettlement(
  marketId: string,
  outcome: string,
  confidence: number
): `0x${string}` {
  return encodeAbiParameters(
    [
      { name: "marketId", type: "uint256" },
      { name: "outcome", type: "bool" },
      { name: "confidence", type: "uint256" },
      { name: "timestamp", type: "uint256" },
    ],
    [
      BigInt(marketId),
      outcome === "Yes",
      BigInt(Math.floor(confidence * 10000)), // Scale to basis points
      BigInt(Math.floor(Date.now() / 1000)),
    ]
  );
}

// --- Entry Point ---
export async function main() {
  const runner = await Runner.newRunner<Config>({ configSchema });
  await runner.run(initWorkflow);
}

main();
