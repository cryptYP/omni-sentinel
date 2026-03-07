# World ID Integration

## Overview

World ID provides sybil-resistant identity verification for OmniSentinel's prediction markets. Users must prove they are unique humans before placing bets, preventing one person from creating multiple accounts to manipulate market outcomes.

## Components

### 1. Frontend — IDKit Widget

File: `frontend/src/components/WorldIDAuth.tsx`

Uses `@worldcoin/idkit` to present the World ID verification flow:
- User clicks "Verify with World ID"
- IDKit widget opens (QR code for World App scan or biometric verification)
- On success, returns a ZK proof (merkle root, nullifier hash, proof array)
- Proof sent to backend for on-chain verification

### 2. On-Chain — WorldIDVerifier Contract

File: `contracts/src/WorldIDVerifier.sol`

- Calls World ID's `verifyProof()` to validate the ZK proof on-chain
- Tracks used nullifier hashes to prevent replay attacks
- Calls `PredictionMarket.setVerified(address)` to mark the user as human
- Uses external nullifier derived from app ID + action name

### 3. Prediction Market Gating

File: `contracts/src/PredictionMarket.sol`

- `onlyVerifiedHuman` modifier on `takePosition()` function
- Checks `worldIdVerified[msg.sender]` mapping
- Only World ID verified addresses can place bets

## Setup

1. Create World ID app at https://developer.worldcoin.org/
2. Set App ID: `app_omni_sentinel`
3. Set Action: `verify_human`
4. Configure in frontend `.env.local`:
   ```
   NEXT_PUBLIC_WORLD_APP_ID=app_omni_sentinel
   NEXT_PUBLIC_WORLD_ACTION=verify_human
   ```
5. Deploy WorldIDVerifier with correct World ID contract address

## References

- World ID Concepts: https://docs.world.org/world-id/concepts
- Frontend (IDKit): https://docs.world.org/world-id/id/web-react
- On-Chain Verification: https://docs.world.org/world-id/id/on-chain
