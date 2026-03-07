# OmniSentinel Quick Install Guide

## Prerequisites

- **Node.js** 20+ (`node --version`)
- **Bun** 1.2+ (`curl -fsSL https://bun.sh/install | bash`)
- **Foundry** (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)
- **CRE CLI** (`curl -sSL https://cre.chain.link/install.sh | bash`)

## 1. Clone & Setup

```bash
git clone https://github.com/cryptYP/omni-sentinel.git
cd omni-sentinel
```

## 2. Smart Contracts (Build + Test)

```bash
cd contracts
forge install --no-git
forge build
forge test
cd ..
```

Expected: 19 tests passing across 3 test suites.

## 3. CRE Workflows (Simulate)

```bash
# Set Gemini API key (get one at https://aistudio.google.com/apikey)
export GEMINI_API_KEY="your-gemini-api-key"

# Install deps and simulate each workflow
cd cre-project/omni-sentinel/risk-monitor
bun install
cd ..

# Simulate RiskMonitor
cre workflow simulate risk-monitor --target staging-settings

# Simulate MarketSettler
cd market-settler && bun install && cd ..
cre workflow simulate market-settler --target staging-settings

# Simulate SafeguardTrigger
cd safeguard-trigger && bun install && cd ..
cre workflow simulate safeguard-trigger --target staging-settings

cd ../..
```

Expected: All 3 simulations pass with "Workflow Simulation Result" output.

## 4. Frontend (Run Locally)

```bash
cd frontend
npm install --legacy-peer-deps
cp .env.example .env.local
# Optionally update .env.local with your own thirdweb Client ID
npm run dev
```

Open http://localhost:3000 in your browser.

Expected: Dashboard loads with Risk Dashboard, Prediction Markets, and Safeguard Status panels.

## Quick Verify (All-in-One)

Run the automated test script:

```bash
cd test-scenarios
chmod +x run-all-tests.sh
./run-all-tests.sh
```
