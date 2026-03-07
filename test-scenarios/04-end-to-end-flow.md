# Test Scenario 04: End-to-End Flow

This scenario walks through the complete OmniSentinel lifecycle, demonstrating how all components work together.

## Overview

```
DeFi Llama API --> RiskMonitor CRE --> RiskOracle Contract --> Frontend Dashboard
                                              |
                                              v
                                    SafeguardTrigger CRE --> SafeguardController
                                              |
                                              v
World ID Verification --> PredictionMarket <-- MarketSettler CRE
```

---

## Step 1: Risk Monitoring (Automated)

**What happens:** RiskMonitor CRE workflow runs every 5 minutes.

1. CRE fetches Aave TVL from DeFi Llama API
2. Risk score derived from TVL data (0-100)
3. Score written onchain to RiskOracle contract
4. Frontend dashboard updates automatically

**Simulation:**
```bash
cd cre-project/omni-sentinel
export GEMINI_API_KEY="your-key"
cre workflow simulate risk-monitor --target staging-settings
```

**Verify:** Risk Dashboard gauge in frontend shows updated score.

---

## Step 2: Safeguard Monitoring (Automated)

**What happens:** SafeguardTrigger CRE workflow runs every 1 minute.

1. CRE reads latest risk score from RiskOracle
2. Compares against threshold (70)
3. If exceeded: triggers SafeguardController circuit breaker
4. Frontend Safeguard Status panel updates

**Simulation:**
```bash
cre workflow simulate safeguard-trigger --target staging-settings
```

**Verify:** If risk > 70, Safeguard Status changes from ACTIVE to PAUSED/LIMITED/EMERGENCY.

---

## Step 3: World ID Verification (User Action)

**What happens:** User proves they're human via World ID.

1. User connects wallet via thirdweb ConnectButton
2. User clicks World ID verification widget
3. Scans QR code with World App
4. Proof verified onchain by WorldIDVerifier contract
5. Address marked as verified in PredictionMarket

**Verify:** Badge changes to "World ID Verified" (green).

---

## Step 4: Create Prediction Market (User Action)

**What happens:** User creates a market on DeFi safety.

1. User enters question: "Will Aave maintain TVL above $20B this week?"
2. Sets deadline to 7 days from now
3. Clicks Create Market
4. Transaction creates market onchain

**Verify:** Market appears in the market viewer with ID, question, and deadline.

---

## Step 5: Take Positions (User Action)

**What happens:** Verified users bet on market outcome.

1. User A bets 0.1 ETH on YES
2. User B bets 0.05 ETH on NO
3. YES and NO pool amounts update in UI

**Verify:** Pool amounts reflect staked ETH.

---

## Step 6: Request Settlement (User Action)

**What happens:** After deadline, anyone can request settlement.

1. User clicks "Request Settlement"
2. Transaction emits `SettlementRequested` event
3. MarketSettler CRE workflow triggers (listens for this event)
4. CRE fetches real-world data to determine outcome
5. Settlement written onchain via `onReport()`

**Simulation (since CRE log trigger requires deployment):**
```bash
cre workflow simulate market-settler --target staging-settings
```

**Verify:** Market shows resolved outcome (YES/NO) and confidence score.

---

## Step 7: Claim Winnings (User Action)

**What happens:** Winners claim their proportional payout.

1. Market shows outcome (e.g., YES)
2. User A (bet YES) clicks Claim Winnings
3. Receives proportional share of total pool
4. User B (bet NO) gets nothing

**Verify:** ETH transferred to winner's wallet.

---

## Complete Data Flow

```
1. DeFi Llama API
   └─> RiskMonitor CRE (cron, 5min)
       └─> RiskOracle.onReport(riskScore)
           ├─> Frontend: Risk Dashboard gauge updates
           └─> SafeguardTrigger CRE (cron, 1min)
               └─> [if score > 70] SafeguardController.onReport(action)
                   └─> Frontend: Safeguard Status updates

2. World App
   └─> WorldIDVerifier.verifyProof()
       └─> PredictionMarket.setVerified(address)
           └─> Frontend: "World ID Verified" badge

3. User creates market
   └─> PredictionMarket.createMarket(question, deadline)
       └─> Users take positions (YES/NO with ETH)
           └─> After deadline: requestSettlement()
               └─> SettlementRequested event
                   └─> MarketSettler CRE (log trigger)
                       └─> PredictionMarket.onReport(outcome)
                           └─> Winners claim ETH
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Risk score shows 0 | RiskMonitor hasn't run yet; simulate the workflow |
| Cannot bet on market | Verify with World ID first |
| Settlement not happening | CRE log trigger requires deployed workflow; use simulation |
| Safeguard stuck in EMERGENCY | Owner must call `resetStatus()` on SafeguardController |
| Frontend not loading data | Check that contract addresses in `.env.local` match deployed contracts |
| Wallet won't connect | Ensure you're on the correct chain (Tenderly VTestNet, ID 73571) |
