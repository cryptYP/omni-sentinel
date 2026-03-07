# OmniSentinel Test Scenarios

This directory contains test scenarios that verify each component of OmniSentinel works correctly and demonstrates how to use the product end-to-end.

## Test Structure

| File | What It Tests |
|------|---------------|
| `QUICK-INSTALL.md` | Setup guide to get running in 5 minutes |
| `run-all-tests.sh` | Automated script that runs all verification tests |
| `01-smart-contracts.md` | Solidity contract tests and manual verification |
| `02-cre-workflows.md` | CRE workflow simulation scenarios |
| `03-frontend-interaction.md` | Frontend UI walkthrough and interaction guide |
| `04-end-to-end-flow.md` | Full system integration test |

## Running Tests

### Automated
```bash
./run-all-tests.sh
```

### Manual
Follow each scenario file in order (01 through 04) for a complete walkthrough.

## Test Coverage Summary

| Component | Tests | Coverage |
|-----------|-------|----------|
| RiskOracle.sol | 5 tests | Score updates, access control, events, history |
| PredictionMarket.sol | 7 tests | Market lifecycle, World ID gating, settlement, claims |
| SafeguardController.sol | 7 tests | Status transitions, owner access, history |
| RiskMonitor CRE | Simulation | Fetches DeFi Llama, derives score, writes onchain |
| MarketSettler CRE | Simulation | Fetches data, determines outcome, writes onchain |
| SafeguardTrigger CRE | Simulation | Reads risk score, compares threshold, triggers if needed |
| Frontend | Build test | Next.js production build passes |
