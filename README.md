# OmniSentinel

**AI-powered cross-chain DeFi Risk Intelligence & Prediction Market Protocol via Chainlink CRE**

---

## What is OmniSentinel?

OmniSentinel is an autonomous DeFi safety system that uses Chainlink's Compute Runtime Environment (CRE) to continuously monitor protocol health, generate AI-driven risk scores, settle prediction markets, and trigger circuit breakers — all on-chain, all trustless.

The protocol solves a critical gap in DeFi: there is no standardized, automated, on-chain mechanism to assess cross-protocol risk in real time and take protective action before cascading failures occur. Manual monitoring doesn't scale, centralized risk feeds introduce trust assumptions, and existing circuit breakers are protocol-specific with no cross-chain visibility.

OmniSentinel fixes this by combining:
- **Chainlink CRE workflows** that run on a decentralized oracle network (DON) with multi-node consensus
- **Gemini AI** for intelligent risk analysis beyond simple threshold checks
- **On-chain circuit breakers** that autonomously pause, limit, or emergency-halt based on risk scores
- **Prediction markets** where users bet on DeFi safety events, settled by CRE + AI with World ID sybil resistance

## How It Works

```
                        ┌─────────────────────┐
                        │   DeFi Llama API     │
                        │   (Live TVL Data)    │
                        └─────────┬───────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                  CHAINLINK CRE (DON)                        │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  RiskMonitor      │  │  MarketSettler   │                 │
│  │  (Cron: 5 min)    │  │  (EVM Log)       │                 │
│  │                   │  │                   │                 │
│  │  HTTP → Gemini AI │  │  Event → Gemini  │                 │
│  │  → Consensus      │  │  + Google Search  │                 │
│  │  → Write onchain  │  │  → Consensus     │                 │
│  └────────┬─────────┘  │  → Write onchain  │                 │
│           │             └────────┬──────────┘                 │
│  ┌────────┴─────────┐           │                             │
│  │ SafeguardTrigger  │  ┌───────┴────────────┐               │
│  │ (Cron: 1 min)     │  │ PrivateRiskMonitor │               │
│  │                   │  │ (Cron: 10 min)     │               │
│  │ Read RiskOracle   │  │                    │               │
│  │ → Threshold check │  │ ConfidentialHTTP   │               │
│  │ → Circuit breaker │  │ → TEE computation  │               │
│  └────────┬─────────┘  │ → Aggregate only   │               │
│           │             └────────┬───────────┘               │
└───────────┼──────────────────────┼───────────────────────────┘
            │                      │
            ▼                      ▼
┌──────────────────────────────────────────────────────────────┐
│              SMART CONTRACTS (Tenderly VTestNet)              │
│                                                              │
│  RiskOracle ◄──── AI risk scores (0-100) per protocol        │
│       │                                                      │
│       ▼                                                      │
│  SafeguardController ◄──── PAUSE / LIMIT / EMERGENCY         │
│                                                              │
│  PredictionMarket ◄──── Settlement outcomes + confidence     │
│       │                                                      │
│       ▼                                                      │
│  WorldIDVerifier ◄──── ZK proof verification (sybil gate)    │
└──────────────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────┐
│              FRONTEND (Next.js + thirdweb)                    │
│                                                              │
│  Risk Dashboard  │  Prediction Markets  │  Portfolio          │
│  Circuit Breaker │  CRE Activity Feed   │  World ID Auth     │
│  Gemini Insights │  Settings            │  Developer Tools   │
└──────────────────────────────────────────────────────────────┘
```

### The CRE Pipeline

1. **RiskMonitor** runs every 5 minutes on the Chainlink DON. Each node independently fetches live protocol data (TVL, volume, utilization) from DeFi Llama, feeds it through Gemini AI for analysis, and produces a risk score (0-100). Scores are aggregated via `consensusMedianAggregation` across nodes and written to the `RiskOracle` smart contract.

2. **SafeguardTrigger** runs every minute. It reads the latest risk score from `RiskOracle` on-chain and applies tiered escalation:
   - Score 50-75: `PAUSE` (reduce exposure)
   - Score 75-90: `LIMIT` (halt non-critical operations)
   - Score 90+: `EMERGENCY` (full lockdown)

3. **MarketSettler** listens for `SettlementRequested` events from the `PredictionMarket` contract. When a market expires and settlement is requested, CRE nodes use Gemini AI with Google Search grounding to fact-check the prediction question against real-world data. Outcomes are aggregated via `consensusIdenticalAggregation` (all nodes must agree) and written on-chain.

4. **PrivateRiskMonitor** uses CRE's `ConfidentialHTTPClient` to fetch sensitive portfolio data inside a Trusted Execution Environment (TEE). Individual position sizes and concentrations are never exposed — only the aggregate risk score is published on-chain.

### Risk Scoring Model

Risk scores are TVL-based with dynamic adjustments:
| TVL Range | Base Score | Risk Level |
|-----------|-----------|------------|
| > $10B | 18 | Low |
| $5B-$10B | 32 | Medium |
| $1B-$5B | 48 | Elevated |
| $100M-$1B | 65 | High |
| < $100M | 82 | Critical |

Additional factors: day-over-day TVL volatility, 7-day rolling standard deviation, cross-protocol correlation.

**Circuit breaker threshold: 70/100** — when any protocol's score exceeds this, SafeguardController engages automatically.

## How It's Built

### Smart Contracts (Solidity)
- **RiskOracle**: Receives signed risk reports from CRE via `IReceiver.onReport()`. Maintains per-protocol score history, emits severity-tiered `SafeguardAlert` events.
- **PredictionMarket**: Full prediction market lifecycle — create markets, take YES/NO positions with ETH stakes, request CRE settlement, claim pro-rata winnings. Requires World ID verification for sybil resistance.
- **SafeguardController**: State machine (ACTIVE → PAUSED → LIMITED → EMERGENCY) driven by CRE risk threshold reports. Maintains audit trail of all triggers.
- **WorldIDVerifier**: Validates ZK proofs from World ID, tracks nullifiers to prevent replay, gates prediction market access.

### CRE Workflows (TypeScript)
- Built with Chainlink CRE SDK using `CronCapability`, `EVMLogTrigger`, `HTTPClient`, `ConfidentialHTTPClient`, `EVMClient`
- Gemini AI integration with temperature 0.1 for deterministic outputs
- `encodeAbiParameters` (viem) for typed on-chain data delivery
- Multi-node consensus: median aggregation for risk scores, identical aggregation for settlements

### Frontend (Next.js 14 + thirdweb)
- **thirdweb SDK**: `ConnectButton`, `useActiveAccount`, `useWalletBalance`, `useSendTransaction`, `useSwitchActiveWalletChain` for wallet connection and contract interaction
- **World ID**: `@worldcoin/idkit` widget for ZK proof generation, server-side verification via `/api/verify-worldid`
- **Gemini AI insights**: `/api/risk-insights` endpoint with 10-minute cache (free tier optimized at ~144 calls/day)
- **DeFi Llama**: Live protocol TVL data with dynamic risk scoring and 90-day history charts (Area, Line, Bar, Candlestick)
- **Tenderly VTestNet**: Auto-rotation when block limits are reached, old VTestNet cleanup to stay within free tier, faucet integration

### Infrastructure
- **Tenderly Virtual TestNet**: Forked Sepolia (Chain ID 73571) with public explorer, auto-rotation via REST API
- **Foundry**: Smart contract compilation, testing, and deployment
- **Vercel-ready**: Next.js App Router with Edge-compatible API routes

## Challenges

1. **Gemini AI response parsing**: Gemini 2.5 Flash returns a "thinking" part before the actual text response. Initial integration failed with "No JSON in response" because we were reading only the first part. Fixed by joining all parts and extracting JSON via regex.

2. **Tenderly VTestNet quota management**: The free tier limits the number of concurrent VTestNets. We accumulated 10+ old instances that consumed quota, causing all RPC calls to fail. Built an auto-cleanup system that keeps max 2 VTestNets and deletes old ones before rotation.

3. **Multi-node consensus for AI outputs**: AI models are non-deterministic, so getting identical outputs across CRE DON nodes for market settlement was challenging. Solved by using very low temperature (0.1), structured JSON output, and `consensusIdenticalAggregation` for settlements vs `consensusMedianAggregation` for numeric risk scores.

4. **Privacy-preserving risk aggregation**: Publishing portfolio risk without exposing individual positions required CRE's `ConfidentialHTTPClient` + TEE architecture. The workflow encrypts API credentials and response data so node operators never see sensitive portfolio details — only the aggregate score is published on-chain.

5. **World ID + prediction markets integration**: Ensuring one-human-one-vote in prediction markets while maintaining privacy required careful nullifier tracking. The ZK proof verification on-chain prevents replay attacks without revealing user identity.

6. **Wallet chain switching**: Auto-switching users from their current network to the Tenderly VTestNet (Chain ID 73571) required fallback logic — if thirdweb's `switchChain` fails, we fall back to raw MetaMask `wallet_addEthereumChain` RPC calls.

## Chainlink CRE Usage

All CRE workflow code is in the [`cre-workflows/`](./cre-workflows/) directory:

| Workflow | File | Trigger | Chainlink Capabilities |
|----------|------|---------|----------------------|
| RiskMonitor | [`main.ts`](./cre-workflows/risk-monitor-workflow/main.ts) | CronCapability (5 min) | HTTPClient, Gemini AI, consensusMedianAggregation, EVMClient.writeReport |
| MarketSettler | [`main.ts`](./cre-workflows/market-settler-workflow/main.ts) | EVMLogTrigger | Event decoding, Gemini AI + Google Search, consensusIdenticalAggregation, EVMClient.writeReport |
| SafeguardTrigger | [`main.ts`](./cre-workflows/safeguard-trigger-workflow/main.ts) | CronCapability (1 min) | EVMClient.callContract (read RiskOracle), threshold logic, EVMClient.writeReport |
| PrivateRiskMonitor | [`main.ts`](./cre-workflows/private-risk-monitor-workflow/main.ts) | CronCapability (10 min) | ConfidentialHTTPClient (TEE), privacy-preserving aggregation, EVMClient.writeReport |

Smart contracts implementing Chainlink's `IReceiver` interface:
- [`RiskOracle.sol`](./contracts/src/RiskOracle.sol) — Receives AI risk scores from CRE
- [`PredictionMarket.sol`](./contracts/src/PredictionMarket.sol) — Receives settlement outcomes from CRE
- [`SafeguardController.sol`](./contracts/src/SafeguardController.sol) — Receives circuit breaker triggers from CRE
- [`IReceiver.sol`](./contracts/src/interfaces/IReceiver.sol) — The shared CRE consumer interface

Frontend CRE integration:
- [`/api/risk-insights/route.ts`](./frontend/src/app/api/risk-insights/route.ts) — Gemini AI risk analysis mirroring the CRE RiskMonitor pipeline
- [`page.tsx`](./frontend/src/app/page.tsx) — CRE pipeline visualization, circuit breaker status, activity feed

## Project Structure

```
omni-sentinel/
├── contracts/                    # Solidity smart contracts (Foundry)
│   ├── src/
│   │   ├── RiskOracle.sol        # CRE consumer: AI risk scores
│   │   ├── PredictionMarket.sol  # CRE consumer: market settlement
│   │   ├── SafeguardController.sol # CRE consumer: circuit breaker
│   │   ├── WorldIDVerifier.sol   # World ID ZK proof verification
│   │   └── interfaces/IReceiver.sol # Chainlink CRE interface
│   ├── test/                     # Foundry tests
│   └── script/Deploy.s.sol      # Deployment script
├── cre-workflows/                # Chainlink CRE workflow code
│   ├── risk-monitor-workflow/    # Cron-triggered AI risk analysis
│   ├── market-settler-workflow/  # Event-triggered market settlement
│   ├── safeguard-trigger-workflow/ # Automated circuit breaker
│   └── private-risk-monitor-workflow/ # Privacy-preserving risk monitor
├── frontend/                     # Next.js 14 + thirdweb dashboard
│   ├── src/app/                  # App Router pages & API routes
│   ├── src/components/           # React components
│   └── src/lib/                  # Shared utilities & hooks
├── test-scenarios/               # Integration test scripts
└── docs/                         # Documentation
```

## Deployments

### Tenderly Virtual TestNet
- **Chain ID:** 73571 (forked from Sepolia)
- **Auto-Rotation:** VTestNets are automatically created/cleaned via the Tenderly REST API when block limits are reached
- **Explorer:** Enabled for judges to inspect on-chain transactions

### Contract Addresses
| Contract | Address |
|----------|---------|
| RiskOracle | `0xDC0Ef4127d33632e76aba237666D8e7927AD5B67` |
| PredictionMarket | `0x580CC465c401B8873b4a119d8bf19c9416223979` |
| SafeguardController | `0x8E381ba0A0E5441C73485f9F046A428c3612aD42` |
| WorldIDVerifier | `0x4f17F1CEc2793ca2e9584D5e956071999eECD790` |

## How to Run

### Prerequisites
- Node.js 20+
- Bun 1.2+ (`curl -fsSL https://bun.sh/install | bash`)
- Foundry (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)

### Quick Start
```bash
# Clone
git clone https://github.com/cryptYP/omni-sentinel.git
cd omni-sentinel

# Smart Contracts
cd contracts && forge install && forge build && forge test

# Frontend
cd ../frontend && npm install
cp .env.example .env.local
# Fill in API keys in .env.local
npm run dev
# Open http://localhost:3000
```

### CRE Workflows
```bash
cd cre-workflows/risk-monitor-workflow
bun install
cre workflow simulate risk-monitor-workflow --target staging-settings
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Oracle Network | Chainlink CRE (Compute Runtime Environment) |
| AI Engine | Gemini 2.5 Flash (risk analysis, market settlement) |
| Smart Contracts | Solidity ^0.8.19, Foundry |
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Wallet | thirdweb SDK (ConnectButton, contract interaction) |
| Identity | World ID (ZK proof sybil resistance) |
| Testnet | Tenderly Virtual TestNet (forked Sepolia) |
| Data | DeFi Llama (live TVL, protocol metrics) |
| Charts | Recharts (Area, Line, Bar, Candlestick) |

## Team
YP & AS

---

Built for the [Chainlink Convergence CRE Hackathon 2026](https://chain.link).

[Repository](https://github.com/cryptYP/omni-sentinel)
