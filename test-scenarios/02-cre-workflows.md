# Test Scenario 02: CRE Workflow Simulations

## Prerequisites
- Bun installed (`bun --version`)
- CRE CLI installed (`cre --version`)
- CRE authenticated (`cre login`)
- `GEMINI_API_KEY` environment variable set

## Test 1: RiskMonitor Workflow

**Purpose:** Fetch Aave TVL from DeFi Llama, derive risk score, write onchain.

```bash
cd cre-project/omni-sentinel
cre workflow simulate risk-monitor --target staging-settings
```

### Expected Output
```
Running RiskMonitor CronTrigger
Protocol TVL: $26,528,530,949    (or similar current value)
Derived Risk Score: 25            (25 for TVL > $10B)
Risk score 25 written onchain. TX status: 2

Workflow Simulation Result: "25"
```

### What to Verify
- [ ] DeFi Llama API returns real TVL data
- [ ] Risk score is 0-100 based on TVL heuristic
- [ ] Onchain write succeeds (TX status: 2 = SUCCESS)
- [ ] Simulation completes without errors

### Risk Score Heuristic
| TVL Range | Expected Score |
|-----------|----------------|
| > $10B | 25 (low risk) |
| $5B - $10B | 35 |
| $1B - $5B | 50 |
| $100M - $1B | 65 |
| < $100M | 80 (high risk) |

---

## Test 2: MarketSettler Workflow

**Purpose:** Fetch protocol health data, determine market settlement outcome, write onchain.

```bash
cre workflow simulate market-settler --target staging-settings
```

### Expected Output
```
Running MarketSettler
Settlement result - outcome: 1, confidence: 9500
Settlement written onchain. TX status: 2

Workflow Simulation Result: "Yes"
```

### What to Verify
- [ ] Protocol health data fetched successfully
- [ ] Settlement outcome determined (1 = Yes, 0 = No)
- [ ] Confidence score calculated (9500 = 95%)
- [ ] Onchain write succeeds

---

## Test 3: SafeguardTrigger Workflow

**Purpose:** Read onchain risk score, compare against threshold, trigger circuit breaker if exceeded.

```bash
cre workflow simulate safeguard-trigger --target staging-settings
```

### Expected Output (risk below threshold)
```
Running SafeguardTrigger CronCheck
Current risk score: 0, threshold: 70
Risk within safe range. No action needed.

Workflow Simulation Result: "OK"
```

### Expected Output (risk above threshold)
```
Running SafeguardTrigger CronCheck
Current risk score: 85, threshold: 70
ALERT: Risk 85 exceeds threshold 70. Triggering action 1
Safeguard triggered. TX status: 2

Workflow Simulation Result: "TRIGGERED:1"
```

### What to Verify
- [ ] Risk score read from RiskOracle contract
- [ ] Threshold comparison works correctly
- [ ] When risk < threshold: no action taken
- [ ] When risk > threshold: appropriate safeguard action triggered
- [ ] Action severity levels: 0=PAUSE (70-75), 1=LIMIT (75-90), 2=EMERGENCY (>90)

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `command not found: cre` | Add `~/.cre/bin` to PATH |
| `command not found: bun` | Add `~/.bun/bin` to PATH |
| `environment variable ... not found` | Export `GEMINI_API_KEY` in your shell |
| `Checking RPC connectivity` hangs | Tenderly VTestNet may be paused; check dashboard |
| `Secret uses itself as env var name` | Warning only, not an error |
