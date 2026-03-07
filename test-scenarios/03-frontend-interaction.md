# Test Scenario 03: Frontend Interaction Guide

## Prerequisites
- Node.js 20+
- Frontend dependencies installed (`cd frontend && npm install --legacy-peer-deps`)
- `.env.local` configured (copy from `.env.example`)

## Starting the Frontend

```bash
cd frontend
npm run dev
# Open http://localhost:3000
```

---

## Screen 1: Main Dashboard

When the app loads, you should see:

### Top Stats Row
| Stat | Expected Value | Description |
|------|----------------|-------------|
| CRE Workflows | 3 Active | RiskMonitor, MarketSettler, SafeguardTrigger |
| System Status | Operational | Current system health |
| Markets | 0+ | Number of prediction markets created |
| Safeguard | ACTIVE | Current circuit breaker status |

### Three Main Panels
1. **Risk Dashboard** (left) - SVG arc gauge showing current risk score
2. **Safeguard Status** (center) - Circuit breaker state with event history
3. **Prediction Markets** (right) - Market creation and interaction UI

### Bottom Section
- CRE workflow info cards explaining each workflow's purpose

---

## Screen 2: Wallet Connection

1. Click **Connect Wallet** button (top right, thirdweb ConnectButton)
2. Select wallet provider (MetaMask, WalletConnect, Coinbase Wallet)
3. Approve connection in your wallet
4. Your address should appear in the header

### What to Verify
- [ ] ConnectButton renders from thirdweb SDK
- [ ] Multiple wallet options available
- [ ] Connected address displays correctly
- [ ] Chain shows Tenderly VTestNet (Chain ID 73571)

---

## Screen 3: Risk Dashboard

The risk gauge displays the latest score from the RiskOracle contract.

| Risk Range | Color | Label |
|------------|-------|-------|
| 0-25 | Green | Low Risk |
| 26-50 | Yellow | Medium Risk |
| 51-75 | Orange | High Risk |
| 76-100 | Red | Critical Risk |

### What to Verify
- [ ] SVG arc gauge renders correctly
- [ ] Risk score reads from RiskOracle contract via `useReadContract`
- [ ] Color changes based on score severity
- [ ] Score updates when RiskOracle data changes

---

## Screen 4: Prediction Markets

### Creating a Market
1. Enter a question (e.g., "Will Aave maintain >110% collateral ratio this week?")
2. Set a deadline (future date/time)
3. Click **Create Market**
4. Approve transaction in wallet

### Taking a Position
1. Select a market ID (0, 1, 2, ...)
2. Enter ETH stake amount
3. Click **Bet YES** or **Bet NO**
4. Approve transaction (requires World ID verification)

### Settling a Market
1. Wait until after the market deadline
2. Click **Request Settlement (triggers CRE workflow)**
3. This emits `SettlementRequested` event that triggers MarketSettler CRE workflow

### Claiming Winnings
1. After settlement, the outcome displays (YES/NO)
2. If you bet on the winning side, click **Claim Winnings**
3. Proportional ETH payout sent to your wallet

### What to Verify
- [ ] Market creation form validates inputs
- [ ] Market data loads (question, deadline, stakes)
- [ ] YES/NO pools display correct ETH amounts
- [ ] World ID verification status shows (Verified/Not Verified badge)
- [ ] Unverified users cannot bet (buttons disabled)
- [ ] Settlement button triggers CRE event

---

## Screen 5: World ID Verification

1. Click the World ID verification widget
2. Scan QR code with World App (or use simulator for testing)
3. Approve verification
4. Badge changes from "Not Verified" (red) to "World ID Verified" (green)

### What to Verify
- [ ] IDKit widget opens with correct App ID
- [ ] QR code generated for World App scanning
- [ ] After verification, `worldIdVerified[address]` returns true
- [ ] Prediction market betting unlocks after verification

---

## Screen 6: Safeguard Status

Displays the current circuit breaker state:

| Status | Icon | Color | Meaning |
|--------|------|-------|---------|
| ACTIVE | Shield check | Green | Normal operation |
| PAUSED | Pause circle | Yellow | Temporarily halted |
| LIMITED | Alert triangle | Orange | Restricted operation |
| EMERGENCY | Octagon | Red | Emergency shutdown |

### Event History
- Shows recent safeguard trigger events
- Each event shows: risk score, action taken, timestamp

### What to Verify
- [ ] Status reads from SafeguardController contract
- [ ] Correct icon/color for current status
- [ ] Event history displays if any safeguard events occurred
