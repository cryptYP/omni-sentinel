# Deployment Guide

## Prerequisites

```bash
# Node.js 20+
node --version

# Bun 1.2.21+ (required by CRE SDK)
curl -fsSL https://bun.sh/install | bash
bun --version

# Foundry (Solidity compiler + deployment)
curl -L https://foundry.paradigm.xyz | bash
foundryup
forge --version

# CRE CLI
# Download from https://cre.chain.link after creating account
cre --version
```

## Step 1: Foundry Setup

```bash
cd contracts
forge install foundry-rs/forge-std
forge build
forge test -vvv
```

## Step 2: Tenderly Virtual TestNet

1. Go to https://dashboard.tenderly.co
2. Create Virtual TestNet (fork Sepolia, Chain ID 73571, enable State Sync + Public Explorer)
3. Copy Admin RPC URL
4. Fund deployer wallet via "Fund Account" (unlimited faucet)

```bash
export TENDERLY_VIRTUAL_TESTNET_RPC="https://virtual.sepolia.rpc.tenderly.co/YOUR_ID"
export PRIVATE_KEY="your_deployer_private_key"
export CRE_FORWARDER_ADDRESS="0x..."  # Get from CRE platform after workflow registration
export WORLD_ID_CONTRACT="0x..."  # World ID contract on Sepolia
```

## Step 3: Deploy Contracts

```bash
cd contracts
forge script script/Deploy.s.sol \
  --rpc-url $TENDERLY_VIRTUAL_TESTNET_RPC \
  --broadcast \
  --slow \
  -vvvv

# Save deployed addresses from console output
# Update CRE workflow config files with these addresses
```

## Step 4: CRE Workflow Setup

```bash
cre auth login

# Set Gemini API key as secret
cre secrets set GEMINI_API_KEY "your_gemini_api_key"

# Update config.staging.json files with deployed contract addresses

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

## Step 5: Frontend

```bash
cd frontend
npm install
cp .env.example .env.local

# Edit .env.local with:
# - thirdweb Client ID
# - World ID App ID
# - Deployed contract addresses
# - Chain ID

npm run dev
```

## Step 6: Vercel Deployment

```bash
cd frontend
npx vercel
# Follow prompts, set environment variables in Vercel dashboard
```
