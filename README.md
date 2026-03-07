# OmniSentinel — AI-Powered Cross-Chain Risk Intelligence & Prediction Protocol

An AI-driven CRE workflow platform that monitors DeFi protocol health across chains, generates risk scores, resolves prediction markets on protocol safety events, and enforces automated compliance safeguards — all orchestrated through Chainlink CRE with World ID sybil resistance, tested on Tenderly Virtual TestNets, and built with thirdweb SDKs.

## Prize Tracks

| Track | Prize Pool | How We Qualify |
|-------|-----------|----------------|
| DeFi & Tokenization | $20,000 | Custom Proof-of-Reserve-style data feed via AI risk scoring |
| CRE & AI | $17,000 | Gemini AI integration in RiskMonitor and MarketSettler CRE workflows |
| Prediction Markets | $16,000 | AI-settled prediction markets on DeFi safety events |
| Risk & Compliance | $16,000 | Automated circuit breaker triggered by risk threshold monitoring |
| Best use of World ID with CRE | $5,000 | Sybil-resistant prediction market participation via World ID |
| Tenderly Virtual TestNets | $5,000 | All contracts deployed and tested on Tenderly VTestNet |
| thirdweb x CRE | Plan prizes | thirdweb SDK for wallet connection and contract interaction |
| Top 10 Projects | $15,000 | Catch-all for quality |

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js + thirdweb)          │
│  - World ID login (IDKit)                                │
│  - Prediction market UI                                  │
│  - Risk dashboard                                        │
│  - thirdweb ConnectWallet + contract interactions        │
└──────────────┬───────────────────────────┬───────────────┘
               │                           │
               ▼                           ▼
┌──────────────────────┐    ┌──────────────────────────────┐
│  Smart Contracts      │    │  CRE Workflows (TypeScript)  │
│  (Solidity)           │    │                              │
│  - PredictionMarket   │    │  Workflow 1: RiskMonitor     │
│  - RiskOracle         │    │    - Cron trigger (5 min)    │
│  - SafeguardController│    │    - Fetch protocol data     │
│  - WorldIDVerifier    │    │    - AI risk analysis        │
│  - IReceiver consumer │    │    - Write risk score onchain│
│                       │    │                              │
│  Deployed on:         │    │  Workflow 2: MarketSettler   │
│  - Sepolia testnet    │    │    - EVM Log trigger         │
│  - Tenderly VTestNet  │    │    - AI outcome resolution   │
│  (forked Sepolia)     │    │    - Write settlement report │
│                       │    │                              │
│                       │    │  Workflow 3: SafeguardTrigger│
│                       │    │    - Cron trigger (1 min)    │
│                       │    │    - Monitor reserve ratios  │
│                       │    │    - Trigger circuit breaker │
└──────────────────────┘    └──────────────────────────────┘
```

## Chainlink CRE Files

All CRE workflow files and smart contracts that use Chainlink:

### CRE Workflows
- [Risk Monitor Workflow](./cre-workflows/risk-monitor-workflow/main.ts) — Cron-triggered AI risk analysis
- [Risk Monitor Config](./cre-workflows/risk-monitor-workflow/config.staging.json)
- [Market Settler Workflow](./cre-workflows/market-settler-workflow/main.ts) — EVM Log-triggered AI settlement
- [Market Settler Config](./cre-workflows/market-settler-workflow/config.staging.json)
- [Safeguard Trigger Workflow](./cre-workflows/safeguard-trigger-workflow/main.ts) — Automated circuit breaker
- [Safeguard Trigger Config](./cre-workflows/safeguard-trigger-workflow/config.staging.json)

### Smart Contracts (CRE Consumer Contracts implementing IReceiver)
- [IReceiver Interface](./contracts/src/interfaces/IReceiver.sol) — CRE consumer interface
- [RiskOracle](./contracts/src/RiskOracle.sol) — Receives AI-generated risk scores from CRE
- [PredictionMarket](./contracts/src/PredictionMarket.sol) — Prediction market settled by CRE + AI
- [SafeguardController](./contracts/src/SafeguardController.sol) — Circuit breaker triggered by CRE
- [WorldIDVerifier](./contracts/src/WorldIDVerifier.sol) — World ID proof verification
- [Deployment Script](./contracts/script/Deploy.s.sol)

### Tests
- [RiskOracle Tests](./contracts/test/RiskOracle.t.sol)
- [PredictionMarket Tests](./contracts/test/PredictionMarket.t.sol)
- [SafeguardController Tests](./contracts/test/SafeguardController.t.sol)

## Deployments

### Tenderly Virtual TestNet
- **Explorer Link:** https://dashboard.tenderly.co/explorer/vnet/69edc2ec-13a2-491f-aa7e-88c38dab91fe/transactions
- **Chain ID:** 73571 (forked from Sepolia)
- All contracts deployed and verified with transaction history

### Contract Addresses
| Contract | Address |
|----------|---------|
| RiskOracle | `0x245B19D0c4b42654fD7b7BaaCA16E2C74d88e97b` |
| PredictionMarket | `0x1255d87986784f9999dB996797d896DbD5456881` |
| SafeguardController | `0x148cef7215C21713F7b0A211703CB0d10bc91239` |
| WorldIDVerifier | `0x4940C1aaf77658480aD2B2220fC99Ae62795D7D6` |

## World ID Integration

- **Frontend:** IDKit widget (`@worldcoin/idkit`) provides proof generation UI
- **On-chain:** `WorldIDVerifier.sol` verifies World ID proofs and marks addresses as human-verified
- **CRE Integration:** Verified status gates prediction market participation, providing sybil resistance
- **App ID:** `app_omni_sentinel`
- **Action:** `verify_human`

## Tenderly Virtual TestNet

- Virtual TestNet forked from Sepolia with state sync enabled
- Public explorer enabled for judges to inspect transactions
- All smart contracts deployed via Foundry
- CRE workflow execution validated against the Virtual TestNet
- Used for safe testing without spending real testnet ETH

## thirdweb Integration

- `ThirdwebProvider` wraps the entire app for wallet/chain context
- `ConnectButton` for wallet connection (supports MetaMask, WalletConnect, Coinbase Wallet)
- `useReadContract` for reading risk scores, market data, safeguard status
- `useSendTransaction` + `prepareContractCall` for creating markets, taking positions, claiming winnings

## How to Run

### Prerequisites
- Node.js 20+
- Bun 1.2.21+ (`curl -fsSL https://bun.sh/install | bash`)
- Foundry (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)
- CRE CLI (download from https://cre.chain.link)

### 1. Clone and Setup
```bash
git clone https://github.com/YOUR_USERNAME/omni-sentinel.git
cd omni-sentinel
```

### 2. Smart Contracts
```bash
cd contracts
forge install
forge build
forge test
```

### 3. Deploy to Tenderly
```bash
# Set environment variables
export PRIVATE_KEY=your_private_key
export TENDERLY_VIRTUAL_TESTNET_RPC=your_tenderly_rpc_url
export CRE_FORWARDER_ADDRESS=your_forwarder_address
export WORLD_ID_CONTRACT=world_id_contract_address

# Deploy
forge script script/Deploy.s.sol --rpc-url $TENDERLY_VIRTUAL_TESTNET_RPC --broadcast --slow
```

### 4. CRE Workflows
```bash
# Authenticate
cre auth login

# Set secrets
cre secrets set GEMINI_API_KEY your_gemini_key

# Simulate each workflow
cd cre-workflows/risk-monitor-workflow
bun install
cre workflow simulate risk-monitor-workflow --target staging-settings

cd ../market-settler-workflow
bun install
cre workflow simulate market-settler-workflow --target staging-settings

cd ../safeguard-trigger-workflow
bun install
cre workflow simulate safeguard-trigger-workflow --target staging-settings
```

### 5. Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# Fill in contract addresses and API keys in .env.local
npm run dev
# Open http://localhost:3000
```

## Video Demo
youtube.com [taken away insertion]

## Team
YP & AS

---

Built for the Chainlink Convergence CRE Hackathon 2026.
