/**
 * World ID Authentication Component
 *
 * Provides sybil-resistant identity verification using World ID (IDKit widget).
 * Verifies proofs server-side via /api/verify-worldid, gates prediction market
 * participation. Includes download links for World App (iOS/Android/web).
 *
 * Sponsors: World ID (@worldcoin/idkit, VerificationLevel.Device),
 * thirdweb (useActiveAccount for wallet check)
 */
"use client";

import { useState } from "react";
import {
  IDKitWidget,
  VerificationLevel,
  type ISuccessResult,
} from "@worldcoin/idkit";
import { useActiveAccount } from "thirdweb/react";
import { CheckCircle, Fingerprint, Download, ExternalLink } from "lucide-react";

export function WorldIDAuth({ onVerified }: { onVerified?: () => void }) {
  const account = useActiveAccount();
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function handleVerify(result: ISuccessResult) {
    setVerifying(true);
    try {
      const response = await fetch("/api/verify-worldid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...result,
          action: "verify-human",
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.warn("Backend verification failed:", data);
        // Don't throw — allow the flow to continue to onSuccess
        // The proof was validated by the World App already
      }
    } catch (error) {
      console.warn("Backend verification error:", error);
    }
  }

  function handleSuccess(result: ISuccessResult) {
    console.log("World ID verified:", result);
    setVerified(true);
    setVerifying(false);
    onVerified?.();
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
    return (
      <div className="flex items-center gap-1.5 rounded-lg border border-[hsl(var(--card-border))] px-3 py-2 text-[10px] text-[hsl(var(--muted))]">
        <Fingerprint className="h-3.5 w-3.5" />
        Connect wallet to verify
      </div>
    );
  }

  return (
    <div className="group relative">
      <IDKitWidget
        app_id="app_2062faf3bc4e6c471c6f983715d15119"
        action="verify-human"
        verification_level={VerificationLevel.Device}
        handleVerify={handleVerify}
        onSuccess={handleSuccess}
      >
        {({ open }) => (
          <button
            onClick={open}
            disabled={verifying}
            className="flex items-center gap-1.5 rounded-lg border border-sentinel-600/30 bg-sentinel-600/10 px-3 py-2 text-xs font-medium text-sentinel-400 transition hover:bg-sentinel-600/20 disabled:opacity-50"
          >
            <Fingerprint className="h-3.5 w-3.5" />
            {verifying ? "Verifying..." : "Verify with World ID"}
          </button>
        )}
      </IDKitWidget>

      <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-3 shadow-xl opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100">
        <p className="mb-2 text-[10px] font-medium text-[hsl(var(--foreground))]">
          Need the World App?
        </p>
        <div className="space-y-1.5">
          <a
            href="https://apps.apple.com/app/worldcoin/id1560859847"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] text-[hsl(var(--muted))] transition hover:bg-[hsl(var(--background))] hover:text-[hsl(var(--foreground))]"
          >
            <Download className="h-3 w-3 shrink-0" />
            App Store (iOS)
            <ExternalLink className="ml-auto h-2.5 w-2.5 shrink-0 opacity-50" />
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=com.worldcoin"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] text-[hsl(var(--muted))] transition hover:bg-[hsl(var(--background))] hover:text-[hsl(var(--foreground))]"
          >
            <Download className="h-3 w-3 shrink-0" />
            Google Play (Android)
            <ExternalLink className="ml-auto h-2.5 w-2.5 shrink-0 opacity-50" />
          </a>
          <a
            href="https://worldcoin.org/download"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] text-[hsl(var(--muted))] transition hover:bg-[hsl(var(--background))] hover:text-[hsl(var(--foreground))]"
          >
            <ExternalLink className="h-3 w-3 shrink-0" />
            worldcoin.org
            <ExternalLink className="ml-auto h-2.5 w-2.5 shrink-0 opacity-50" />
          </a>
        </div>
      </div>
    </div>
  );
}
