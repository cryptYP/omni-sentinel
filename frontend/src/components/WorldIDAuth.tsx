"use client";

import { useState } from "react";
import {
  IDKitWidget,
  VerificationLevel,
  type ISuccessResult,
} from "@worldcoin/idkit";
import { useActiveAccount } from "thirdweb/react";
import { CheckCircle, Fingerprint } from "lucide-react";

export function WorldIDAuth() {
  const account = useActiveAccount();
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function handleVerify(result: ISuccessResult) {
    setVerifying(true);

    try {
      // Send proof to backend for on-chain verification
      const response = await fetch("/api/verify-worldid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proof: result,
          address: account?.address,
        }),
      });

      if (response.ok) {
        setVerified(true);
      }
    } catch (error) {
      console.error("World ID verification failed:", error);
    } finally {
      setVerifying(false);
    }
  }

  if (verified) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg bg-risk-low/10 px-3 py-2 text-xs font-medium text-risk-low">
        <CheckCircle className="h-3.5 w-3.5" />
        Verified Human
      </div>
    );
  }

  if (!account) {
    return null;
  }

  return (
    <IDKitWidget
      app_id={process.env.NEXT_PUBLIC_WORLD_APP_ID as `app_${string}`}
      action={process.env.NEXT_PUBLIC_WORLD_ACTION!}
      verification_level={VerificationLevel.Orb}
      onSuccess={handleVerify}
    >
      {({ open }) => (
        <button
          onClick={open}
          disabled={verifying}
          className="flex items-center gap-1.5 rounded-lg border border-[hsl(var(--card-border))] px-3 py-2 text-xs font-medium transition hover:bg-white/5 disabled:opacity-50"
        >
          <Fingerprint className="h-3.5 w-3.5" />
          {verifying ? "Verifying..." : "Verify with World ID"}
        </button>
      )}
    </IDKitWidget>
  );
}
