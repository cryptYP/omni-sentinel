#!/usr/bin/env bash
# OmniSentinel — Automated Test Runner
# Verifies all components build and run correctly.

set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$HOME/.foundry/bin:$HOME/.bun/bin:$HOME/.cre/bin:$PATH"
PASS=0
FAIL=0
WARN=0

green() { printf "\033[32m%s\033[0m\n" "$1"; }
red() { printf "\033[31m%s\033[0m\n" "$1"; }
yellow() { printf "\033[33m%s\033[0m\n" "$1"; }
bold() { printf "\033[1m%s\033[0m\n" "$1"; }

report() {
  if [ "$2" = "pass" ]; then
    green "  PASS: $1"
    PASS=$((PASS + 1))
  elif [ "$2" = "fail" ]; then
    red "  FAIL: $1"
    FAIL=$((FAIL + 1))
  else
    yellow "  WARN: $1"
    WARN=$((WARN + 1))
  fi
}

bold "============================================"
bold "  OmniSentinel Test Runner"
bold "============================================"
echo ""

# ── Test 1: Smart Contracts ──────────────────────────────
bold "1. Smart Contracts"

if command -v forge &>/dev/null; then
  cd "$ROOT_DIR/contracts"

  if forge build --quiet 2>/dev/null; then
    report "Contracts compile" "pass"
  else
    report "Contracts compile" "fail"
  fi

  TEST_OUTPUT=$(forge test 2>&1)
  TEST_COUNT=$(echo "$TEST_OUTPUT" | grep -oE '[0-9]+ passed' | head -1 | grep -oE '[0-9]+')
  FAIL_COUNT=$(echo "$TEST_OUTPUT" | grep -oE '[0-9]+ failed' | head -1 | grep -oE '[0-9]+')

  if [ "${FAIL_COUNT:-0}" = "0" ] && [ "${TEST_COUNT:-0}" -gt "0" ]; then
    report "All $TEST_COUNT tests pass" "pass"
  else
    report "Tests: $TEST_COUNT passed, $FAIL_COUNT failed" "fail"
  fi
else
  report "Foundry not installed (skipping)" "warn"
fi

echo ""

# ── Test 2: Frontend Build ───────────────────────────────
bold "2. Frontend"

cd "$ROOT_DIR/frontend"

if [ ! -d "node_modules" ]; then
  echo "  Installing dependencies..."
  npm install --legacy-peer-deps --silent 2>/dev/null
fi

if npx next build 2>/dev/null; then
  report "Frontend builds successfully" "pass"
else
  report "Frontend build failed" "fail"
fi

echo ""

# ── Test 3: CRE Workflows ───────────────────────────────
bold "3. CRE Workflows"

export PATH="$HOME/.bun/bin:$HOME/.cre/bin:$PATH"

if ! command -v cre &>/dev/null; then
  report "CRE CLI not installed (skipping)" "warn"
elif ! command -v bun &>/dev/null; then
  report "Bun not installed (skipping)" "warn"
else
  # Set a dummy key if not provided
  export GEMINI_API_KEY="${GEMINI_API_KEY:-dummy-key-for-test}"

  cd "$ROOT_DIR/cre-project/omni-sentinel"

  # Install deps if needed
  for wf in risk-monitor market-settler safeguard-trigger; do
    if [ ! -d "$wf/node_modules" ]; then
      (cd "$wf" && bun install --silent 2>/dev/null)
    fi
  done

  # RiskMonitor
  if cre workflow simulate risk-monitor --target staging-settings 2>&1 | grep -q "Workflow Simulation Result"; then
    report "RiskMonitor simulation passes" "pass"
  else
    report "RiskMonitor simulation failed" "fail"
  fi

  # MarketSettler
  if cre workflow simulate market-settler --target staging-settings 2>&1 | grep -q "Workflow Simulation Result"; then
    report "MarketSettler simulation passes" "pass"
  else
    report "MarketSettler simulation failed" "fail"
  fi

  # SafeguardTrigger
  if cre workflow simulate safeguard-trigger --target staging-settings 2>&1 | grep -q "Workflow Simulation Result"; then
    report "SafeguardTrigger simulation passes" "pass"
  else
    report "SafeguardTrigger simulation failed" "fail"
  fi
fi

echo ""

# ── Test 4: File Structure ──────────────────────────────
bold "4. Project Structure"

check_file() {
  if [ -f "$ROOT_DIR/$1" ]; then
    report "$1 exists" "pass"
  else
    report "$1 missing" "fail"
  fi
}

check_file "contracts/src/RiskOracle.sol"
check_file "contracts/src/PredictionMarket.sol"
check_file "contracts/src/SafeguardController.sol"
check_file "contracts/src/WorldIDVerifier.sol"
check_file "contracts/src/interfaces/IReceiver.sol"
check_file "frontend/src/app/page.tsx"
check_file "frontend/src/components/RiskDashboard.tsx"
check_file "frontend/src/components/PredictionMarkets.tsx"
check_file "frontend/src/components/SafeguardStatus.tsx"
check_file "frontend/src/components/WorldIDAuth.tsx"
check_file "cre-project/omni-sentinel/risk-monitor/workflow.ts"
check_file "cre-project/omni-sentinel/market-settler/workflow.ts"
check_file "cre-project/omni-sentinel/safeguard-trigger/workflow.ts"
check_file "README.md"

echo ""

# ── Test 5: No Secrets in Tracked Files ──────────────────
bold "5. Security Check"

cd "$ROOT_DIR"
TRACKED_FILES=$(git ls-files 2>/dev/null)

if echo "$TRACKED_FILES" | grep -qE '\.env\.local$|\.env$|secrets\.yaml$'; then
  report "Secrets file tracked in git!" "fail"
else
  report "No secrets in tracked files" "pass"
fi

# Check for hardcoded API keys in tracked files
if git grep -lE 'AIzaSy[a-zA-Z0-9_-]{33}' 2>/dev/null; then
  report "Hardcoded Google API key found in tracked files!" "fail"
else
  report "No hardcoded API keys in tracked files" "pass"
fi

echo ""

# ── Summary ──────────────────────────────────────────────
bold "============================================"
bold "  RESULTS"
bold "============================================"
green "  Passed: $PASS"
if [ "$FAIL" -gt 0 ]; then
  red "  Failed: $FAIL"
else
  echo "  Failed: 0"
fi
if [ "$WARN" -gt 0 ]; then
  yellow "  Warnings: $WARN"
fi
echo ""

if [ "$FAIL" -gt 0 ]; then
  red "  Some tests failed. See output above."
  exit 1
else
  green "  All tests passed!"
  exit 0
fi
