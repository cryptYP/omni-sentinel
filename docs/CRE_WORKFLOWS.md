# CRE Workflows Deep Dive

## Workflow Pattern

All three workflows follow the CRE trigger-callback model:

```typescript
function initWorkflow(config: Config) {
  const trigger = SomeTrigger.trigger({ ... });
  return [cre.handler(trigger, callbackFunction)];
}

function callbackFunction(runtime: Runtime<Config>): void {
  // 1. Fetch/read data
  // 2. Process (optionally with AI)
  // 3. Encode report
  // 4. Write onchain
}
```

## Workflow 1: RiskMonitor

**File:** `cre-workflows/risk-monitor-workflow/main.ts`

**Trigger:** `CronCapability` — runs on schedule (`*/5 * * * *`)

**Capabilities Used:**
- `HTTPClient` — fetch DeFi Llama API + call Gemini AI
- `EVMClient.writeReport()` — deliver risk score onchain
- `consensusMedianAggregation` — DON nodes agree on median risk score
- `runtime.report()` — generate signed report
- Secrets (`nodeRuntime.getSecret("GEMINI_API_KEY")`)

**Flow:**
1. Each DON node independently fetches TVL from DeFi Llama
2. Median consensus on TVL value
3. Each node independently queries Gemini AI for risk scoring
4. Median consensus on risk score (0-100)
5. Report signed and delivered to `RiskOracle.onReport()`

## Workflow 2: MarketSettler

**File:** `cre-workflows/market-settler-workflow/main.ts`

**Trigger:** `EVMLogTrigger` — listens for `SettlementRequested(uint256,string,uint256)` event

**Capabilities Used:**
- `EVMLogTrigger` — event-driven trigger
- `HTTPClient` — call Gemini AI with search grounding
- `EVMClient.writeReport()` — deliver settlement onchain
- `consensusIdenticalAggregation` — all nodes must agree on outcome
- Secrets for Gemini API key

**Flow:**
1. PredictionMarket contract emits `SettlementRequested` event
2. CRE workflow picks up the event with market ID and question
3. Each DON node queries Gemini AI (with Google Search grounding) to resolve the question
4. Identical consensus — all nodes must agree on Yes/No outcome
5. Settlement report delivered to `PredictionMarket.onReport()`

## Workflow 3: SafeguardTrigger

**File:** `cre-workflows/safeguard-trigger-workflow/main.ts`

**Trigger:** `CronCapability` — runs every minute (`* * * * *`)

**Capabilities Used:**
- `CronCapability` — high-frequency monitoring
- `EVMClient.callContract()` — read onchain risk score (view call)
- `EVMClient.writeReport()` — trigger circuit breaker (conditional)
- `encodeCallMsg` + `LAST_FINALIZED_BLOCK_NUMBER` — safe onchain reads
- `viem` — ABI encoding/decoding

**Flow:**
1. Read `RiskOracle.getLatestRiskScore()` via EVM view call
2. Compare risk score against configurable threshold
3. If exceeded: determine severity (PAUSE < 75, LIMIT < 90, EMERGENCY ≥ 90)
4. Encode and deliver safeguard report to `SafeguardController.onReport()`
5. If NOT exceeded: workflow completes without writing (saves gas)

## Configuration

Each workflow has a `config.staging.json` with:
- Chain selector names (e.g., `ethereum-testnet-sepolia`)
- Contract addresses (deployed on Tenderly/Sepolia)
- API endpoints
- Thresholds and gas limits

Secrets are managed via `cre secrets set KEY value` (never in config files).
