# Tenderly Virtual TestNet Setup

## Why Tenderly

- Fork Sepolia with real mainnet state (via state sync)
- Unlimited test ETH (built-in faucet)
- Public explorer for judges to verify deployments
- Transaction debugging with stack traces
- No rate limits on RPC calls

## Setup Steps

### 1. Create Account
Go to https://dashboard.tenderly.co and sign up.

### 2. Create Virtual TestNet
- Dashboard → Virtual TestNets → "Create Virtual TestNet"
- **Parent Network:** Sepolia
- **Chain ID:** 73571 (custom)
- **State Sync:** YES (syncs Sepolia state)
- **Public Explorer:** YES (required for judges)

### 3. Get RPC URL
- Click on your Virtual TestNet
- Copy the **Admin RPC URL** (has write access for deployment)
- Copy the **Public RPC URL** (for frontend/read-only)

### 4. Fund Deployer
- In Tenderly dashboard: click "Fund Account"
- Enter your deployer wallet address
- Add test ETH (e.g., 100 ETH)

### 5. Deploy
```bash
forge script script/Deploy.s.sol \
  --rpc-url $TENDERLY_VIRTUAL_TESTNET_RPC \
  --broadcast --slow
```

### 6. Verify on Explorer
- Go to Virtual TestNet Explorer
- Search for deployed contract addresses
- Verify source code (optional but recommended)

## Explorer Link

**IMPORTANT:** Save and include this link in your submission:
```
https://dashboard.tenderly.co/explorer/vnet/YOUR_VNET_ID
```

This is the #1 thing Tenderly judges look for.

## References
- Docs: https://docs.tenderly.co/virtual-testnets
- Quickstart: https://docs.tenderly.co/virtual-testnets/quickstart
- Deploy Contracts: https://docs.tenderly.co/virtual-testnets/develop/deploy-contracts
