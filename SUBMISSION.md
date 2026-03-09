# OmniSentinel — Hackathon Submission

## Project Name
OmniSentinel

## One-Line Description
AI-powered cross-chain DeFi Risk Intelligence & Prediction Market Protocol via Chainlink CRE

## Full Project Description

OmniSentinel is a fully automated risk intelligence protocol for DeFi. It solves a problem that has cost users billions: there is no trustless, on-chain system that continuously monitors protocol health across chains, scores risk using real AI inference, and takes automated protective action without a human in the loop.

OmniSentinel does all three. Four Chainlink CRE workflows run continuously on a decentralized oracle network. The first monitors live TVL and reserve data from protocols like Aave, Compound, and Lido via DeFi Llama, feeds it to Gemini AI for risk analysis, aggregates scores across DON nodes via multi-node consensus, and writes structured risk scores on-chain to a RiskOracle contract every 5 minutes. A second workflow listens for on-chain EVM log events from the PredictionMarket contract and uses Gemini with Google Search grounding to autonomously settle prediction markets on DeFi safety outcomes — no human arbitration, no centralized resolver. A third workflow reads the latest risk score from the RiskOracle every minute and triggers a SafeguardController circuit breaker with tiered escalation (pause, limit, emergency halt) if thresholds are breached, shutting down exposure before damage compounds. A fourth confidential workflow uses CRE's encrypted HTTP capability and trusted execution environment to aggregate sensitive portfolio risk data without exposing raw positions or API credentials on-chain — only the aggregate score is published.

Users interact through a Next.js frontend built with thirdweb for wallet connection and contract interaction. They can take multiple YES/NO positions on DeFi safety prediction markets, track positions in a filtered portfolio view, and monitor real-time risk scores with AI-generated contextual insights. All market participation requires verification through World ID to prevent sybil attacks on market outcomes — one human, one voice. Contracts are deployed and tested on a Tenderly Virtual TestNet forked from Sepolia, with auto-rotation that creates fresh instances and cleans up old ones when block limits are reached. The system has 80+ on-chain transactions already on record across 34 RiskOracle updates, 7 prediction markets, 8 circuit breaker state transitions, and 4 World ID verifications.

## How Is It Built

The core execution layer is four Chainlink CRE workflows written in TypeScript. RiskMonitorWorkflow uses a CronCapability trigger every 5 minutes, fetches live protocol data from DeFi Llama via HTTPClient, constructs a structured prompt for Gemini AI (temperature 0.1 for deterministic output), parses the scored JSON response, runs consensusMedianAggregation across DON nodes, and writes the result on-chain via EVMClient.writeReport() to the RiskOracle contract's IReceiver.onReport() callback. MarketSettlerWorkflow uses an EVMLogTrigger listening for SettlementRequested events from the PredictionMarket contract. When a market's deadline passes and settlement is requested, CRE fires the workflow — Gemini evaluates the outcome using Google Search grounding for fact-checking, nodes reach agreement via consensusIdenticalAggregation (all must match), and the settlement report with outcome and confidence score is committed on-chain. SafeguardTriggerWorkflow is a 1-minute cron that reads the latest risk score from RiskOracle via EVMClient.callContract(), applies tiered threshold logic (PAUSE at 50-75, LIMIT at 75-90, EMERGENCY at 90+), and triggers SafeguardController's state machine accordingly. PrivateRiskMonitorWorkflow uses CRE's ConfidentialHTTPClient to encrypt API credentials and response data — decryption happens exclusively inside a TEE so node operators never see portfolio details — and publishes only the weighted aggregate risk score on-chain.

The four Solidity contracts (RiskOracle, PredictionMarket, SafeguardController, WorldIDVerifier) all implement the IReceiver interface for standardized CRE report delivery. RiskOracle maintains per-protocol score history and emits severity-tiered SafeguardAlert events. PredictionMarket handles full market lifecycle — creation, multi-position staking with native ETH, CRE-powered settlement with confidence scores, and pro-rata winner payouts. SafeguardController implements a state machine (ACTIVE/PAUSED/LIMITED/EMERGENCY) with a complete audit trail of every trigger. WorldIDVerifier validates ZK proofs on-chain and tracks nullifier hashes to prevent replay, gating prediction market access to verified humans. Contracts are compiled with Foundry and deployed via Deploy.s.sol to a Tenderly Virtual TestNet (Chain ID 73571, forked Sepolia). The VTestNet supports auto-rotation via the Tenderly REST API — when block limits are hit, a new instance is created, old ones are cleaned up (max 2 to stay within free tier), and the deployer is funded via tenderly_setBalance.

The frontend is Next.js 14 with thirdweb's ConnectButton, useActiveAccount, useWalletBalance, useSendTransaction, and useSwitchActiveWalletChain hooks for wallet connection and on-chain interaction. Contract calls use prepareContractCall with ABI-typed parameters and automatic chain switching to the Tenderly VTestNet with MetaMask fallback. Risk data flows through API routes: /api/defi fetches live TVL from DeFi Llama, /api/defi/[protocol] computes dynamic risk scores using TVL tiers + day-over-day volatility + 7-day rolling standard deviation, and /api/risk-insights feeds protocol data to Gemini 2.5 Flash for contextual risk insights with a 10-minute cache optimized for the free tier. World ID verification uses @worldcoin/idkit for client-side ZK proof generation with server-side verification. The dashboard provides four chart styles (Area, Line, Bar, Candlestick) via Recharts, portfolio management with status filters and sorting, an inbox notification system, and a developer tools panel with VTestNet controls, faucet, and CRE pipeline visualization.

## Challenges

1. **Gemini AI response parsing** — Gemini 2.5 Flash returns a "thinking" part before the actual text response. Initial integration failed with "No JSON in response" because we were reading only the first part. Fixed by joining all parts and extracting JSON via regex.

2. **Tenderly VTestNet quota management** — The free tier limits the number of concurrent VTestNets. We accumulated 10+ old instances that consumed quota, causing all RPC calls to fail. Built an auto-cleanup system that keeps max 2 VTestNets and deletes old ones before rotation.

3. **Multi-node consensus for AI outputs** — AI models are non-deterministic, so getting identical outputs across CRE DON nodes for market settlement was challenging. Solved by using very low temperature (0.1), structured JSON output, and consensusIdenticalAggregation for settlements vs consensusMedianAggregation for numeric risk scores.

4. **Privacy-preserving risk aggregation** — Publishing portfolio risk without exposing individual positions required CRE's ConfidentialHTTPClient + TEE architecture. The workflow encrypts API credentials and response data so node operators never see sensitive portfolio details — only the aggregate score is published on-chain.

5. **World ID + prediction markets** — Ensuring one-human-one-vote in prediction markets while maintaining privacy required careful nullifier tracking. The ZK proof verification on-chain prevents replay attacks without revealing user identity.

6. **Wallet chain switching** — Auto-switching users from their current network to the Tenderly VTestNet (Chain ID 73571) required fallback logic — if thirdweb's switchChain fails, we fall back to raw MetaMask wallet_addEthereumChain RPC calls.

## Link to Project Repo
https://github.com/cryptYP/omni-sentinel

## Chainlink Usage
See the [Chainlink CRE Usage section in README.md](./README.md#chainlink-cre-usage) and the [Prize Track Qualification section](./README.md#prize-track-qualification) for direct links to every CRE workflow and IReceiver contract.
