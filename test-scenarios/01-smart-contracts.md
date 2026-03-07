# Test Scenario 01: Smart Contracts

## Prerequisites
- Foundry installed (`forge --version`)

## Automated Tests

```bash
cd contracts
forge test -vv
```

### Expected Output

```
[PASS] testOnReportUpdatesScore() (gas: ...)
[PASS] testOnlyForwarderCanReport() (gas: ...)
[PASS] testEmitsSafeguardAlert() (gas: ...)
[PASS] testScoreHistory() (gas: ...)
[PASS] testAddAndRemoveForwarder() (gas: ...)
[PASS] testCreateMarket() (gas: ...)
[PASS] testTakePosition() (gas: ...)
[PASS] testRequiresWorldIdVerification() (gas: ...)
[PASS] testSettleMarket() (gas: ...)
[PASS] testClaimWinnings() (gas: ...)
[PASS] testCannotTakePositionAfterDeadline() (gas: ...)
[PASS] testCannotSettleBeforeDeadline() (gas: ...)
[PASS] testInitialStatus() (gas: ...)
[PASS] testPauseAction() (gas: ...)
[PASS] testLimitAction() (gas: ...)
[PASS] testEmergencyAction() (gas: ...)
[PASS] testResetToActive() (gas: ...)
[PASS] testOnlyOwnerCanReset() (gas: ...)
[PASS] testSafeguardHistory() (gas: ...)

Test result: ok. 19 passed; 0 failed
```

## Manual Contract Verification

### RiskOracle
| Scenario | Expected Behavior |
|----------|-------------------|
| Authorized forwarder calls `onReport()` | Score stored, `RiskScoreUpdated` event emitted |
| Unauthorized address calls `onReport()` | Transaction reverts with "Unauthorized" |
| Risk score > 80 | `SafeguardAlert` event emitted with severity "CRITICAL" |
| Risk score 60-80 | `SafeguardAlert` event emitted with severity "HIGH" |
| Call `getLatestRiskScore()` | Returns most recent score and timestamp |
| Call `getScoreHistory(protocolId)` | Returns array of all historical scores |

### PredictionMarket
| Scenario | Expected Behavior |
|----------|-------------------|
| Call `createMarket("Will X happen?", futureTimestamp)` | Market created, ID returned |
| Verified user calls `takePosition(id, true)` with ETH | Position recorded, ETH held |
| Unverified user calls `takePosition()` | Reverts with "Not verified" |
| Call `requestSettlement(id)` after deadline | `SettlementRequested` event emitted |
| Forwarder calls `onReport()` with settlement data | Market resolved, outcome set |
| Winner calls `claimWinnings(id)` | Proportional ETH payout sent |
| Loser calls `claimWinnings(id)` | Reverts (no winnings to claim) |

### SafeguardController
| Scenario | Expected Behavior |
|----------|-------------------|
| Deploy contract | Status = ACTIVE (0) |
| `onReport()` with action=0 | Status changes to PAUSED |
| `onReport()` with action=1 | Status changes to LIMITED |
| `onReport()` with action=2 | Status changes to EMERGENCY |
| Owner calls `resetStatus()` | Status returns to ACTIVE |
| Non-owner calls `resetStatus()` | Transaction reverts |
| Multiple triggers | Each recorded in `safeguardHistory` |

### WorldIDVerifier
| Scenario | Expected Behavior |
|----------|-------------------|
| Valid World ID proof submitted | Address marked as verified in PredictionMarket |
| Same nullifier used twice | Transaction reverts with "Nullifier used" |
| Invalid proof submitted | Transaction reverts |
