# OmniSentinel Architecture

## System Components

### 1. CRE Workflows (Core)

Three TypeScript workflows built with `@chainlink/cre-sdk`:

**RiskMonitor** — Cron-triggered every 5 minutes
1. Fetches DeFi protocol TVL from DeFi Llama API
2. Sends data to Gemini AI for risk scoring (0-100)
3. Achieves consensus across DON nodes via median aggregation
4. Writes signed risk score to `RiskOracle` contract via `onReport()`

**MarketSettler** — Triggered by `SettlementRequested` EVM event
1. Decodes market question and ID from event log
2. Queries Gemini AI with Google Search grounding for real-world verification
3. Returns structured outcome (Yes/No) with confidence score
4. Writes settlement result to `PredictionMarket` contract via `onReport()`

**SafeguardTrigger** — Cron-triggered every 1 minute
1. Reads current risk score from `RiskOracle` contract (on-chain read)
2. Compares against configurable threshold
3. If exceeded: encodes safeguard action (PAUSE/LIMIT/EMERGENCY based on severity)
4. Writes circuit breaker command to `SafeguardController` contract

### 2. Smart Contracts

All contracts implement `IReceiver` to accept CRE workflow reports:

- **RiskOracle** — Stores risk scores with history per protocol ID
- **PredictionMarket** — ETH-staked binary prediction markets with World ID gating
- **SafeguardController** — State machine (ACTIVE → PAUSED → LIMITED → EMERGENCY)
- **WorldIDVerifier** — Verifies World ID ZK proofs and registers verified humans

### 3. Frontend

Next.js 14 with thirdweb SDK:
- Risk dashboard with live score gauge
- Prediction market creation/betting/settlement UI
- Safeguard status monitor with event history
- World ID verification widget (IDKit)
- thirdweb ConnectButton for wallet management

## Data Flow

```
DeFi Llama API ──→ CRE RiskMonitor ──→ Gemini AI ──→ RiskOracle (onchain)
                                                           │
                                                           ▼
                   CRE SafeguardTrigger ←── reads risk score
                           │
                           ▼ (if threshold exceeded)
                   SafeguardController (circuit breaker)

User creates market ──→ PredictionMarket contract
User requests settlement ──→ SettlementRequested event
                                      │
                                      ▼
                   CRE MarketSettler ──→ Gemini AI (search grounding)
                                      │
                                      ▼
                   PredictionMarket.onReport() (settles market)
```

## Security Model

- All CRE-delivered data goes through DON consensus (no single oracle)
- World ID prevents sybil attacks on prediction markets
- Forwarder address access control on all IReceiver contracts
- Owner-only admin functions with explicit access modifiers
- No secrets exposed on-chain or in frontend (all in CRE secrets + env vars)
