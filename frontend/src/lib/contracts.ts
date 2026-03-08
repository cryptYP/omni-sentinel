/**
 * Smart Contract Definitions — OmniSentinel
 *
 * ABI fragments and contract instances for RiskOracle, PredictionMarket,
 * and SafeguardController. Deployed on Tenderly VTestNet (Chain ID 73571).
 *
 * Sponsors: thirdweb (getContract, defineChain), Tenderly VTestNet (chain config)
 */
import { getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { client } from "./thirdweb";

// Tenderly Virtual TestNet (Chain ID 73571)
export const tenderlyVTestNet = defineChain({
  id: 73571,
  name: "Tenderly Virtual TestNet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  testnet: true,
});

// ABI fragments for our contracts
export const RISK_ORACLE_ABI = [
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
  {
    name: "updateCount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getScoreHistory",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "protocolId", type: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "riskScore", type: "uint256" },
          { name: "timestamp", type: "uint256" },
          { name: "protocolId", type: "bytes32" },
        ],
      },
    ],
  },
] as const;

export const PREDICTION_MARKET_ABI = [
  {
    name: "createMarket",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "question", type: "string" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "takePosition",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "marketId", type: "uint256" },
      { name: "isYes", type: "bool" },
    ],
    outputs: [],
  },
  {
    name: "requestSettlement",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "claimWinnings",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "getMarket",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "question", type: "string" },
          { name: "deadline", type: "uint256" },
          { name: "totalYesStake", type: "uint256" },
          { name: "totalNoStake", type: "uint256" },
          { name: "resolved", type: "bool" },
          { name: "outcome", type: "bool" },
          { name: "confidence", type: "uint256" },
          { name: "settlementTimestamp", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "nextMarketId",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "worldIdVerified",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export const SAFEGUARD_ABI = [
  {
    name: "currentStatus",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    name: "getSafeguardHistory",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "riskScore", type: "uint256" },
          { name: "triggerTimestamp", type: "uint256" },
          { name: "action", type: "uint8" },
          { name: "executedAt", type: "uint256" },
        ],
      },
    ],
  },
] as const;

// Contract instances
export function getRiskOracle() {
  return getContract({
    client,
    chain: tenderlyVTestNet,
    address: process.env.NEXT_PUBLIC_RISK_ORACLE_ADDRESS as `0x${string}`,
    abi: RISK_ORACLE_ABI,
  });
}

export function getPredictionMarket() {
  return getContract({
    client,
    chain: tenderlyVTestNet,
    address: process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS as `0x${string}`,
    abi: PREDICTION_MARKET_ABI,
  });
}

export function getSafeguardController() {
  return getContract({
    client,
    chain: tenderlyVTestNet,
    address: process.env.NEXT_PUBLIC_SAFEGUARD_CONTROLLER_ADDRESS as `0x${string}`,
    abi: SAFEGUARD_ABI,
  });
}
