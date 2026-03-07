"use client";

import { useActiveAccount } from "thirdweb/react";
import { useDefiProtocols } from "@/lib/hooks";
import { Wallet, Shield, TrendingUp, ExternalLink } from "lucide-react";

export function Portfolio({ isVerified }: { isVerified: boolean }) {
  const account = useActiveAccount();
  const { protocols } = useDefiProtocols();

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sentinel-600/10">
          <Wallet className="h-6 w-6 text-sentinel-400" />
        </div>
        <p className="text-xs font-medium">Connect your wallet</p>
        <p className="mt-1 text-[10px] text-[hsl(var(--muted))]">
          View your portfolio, positions, and verification status
        </p>
      </div>
    );
  }

  const addr = account.address;
  const shortAddr = `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="space-y-4">
      {/* Wallet info */}
      <div className="flex items-center gap-3 rounded-lg bg-[hsl(var(--background))] p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sentinel-600/10">
          <Wallet className="h-4 w-4 text-sentinel-400" />
        </div>
        <div className="flex-1">
          <p className="font-mono text-xs">{shortAddr}</p>
          <div className="mt-0.5 flex items-center gap-2">
            {isVerified ? (
              <span className="flex items-center gap-1 text-[10px] text-risk-low">
                <Shield className="h-3 w-3" /> World ID Verified
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-risk-critical">
                <Shield className="h-3 w-3" /> Not Verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-[hsl(var(--background))] p-2.5 text-center">
          <p className="text-[9px] text-[hsl(var(--muted))]">Positions</p>
          <p className="text-sm font-bold">0</p>
        </div>
        <div className="rounded-lg bg-[hsl(var(--background))] p-2.5 text-center">
          <p className="text-[9px] text-[hsl(var(--muted))]">Markets</p>
          <p className="text-sm font-bold">5</p>
        </div>
        <div className="rounded-lg bg-[hsl(var(--background))] p-2.5 text-center">
          <p className="text-[9px] text-[hsl(var(--muted))]">Protocols</p>
          <p className="text-sm font-bold">{protocols.length}</p>
        </div>
      </div>

      {/* Monitored protocols from wallet perspective */}
      <div>
        <p className="mb-2 text-[10px] font-medium text-[hsl(var(--muted))]">
          Monitored Protocols
        </p>
        <div className="space-y-1.5">
          {protocols.slice(0, 4).map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-[hsl(var(--card-border))] p-2.5"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    p.riskScore > 50 ? "bg-risk-high" : "bg-risk-low"
                  }`}
                />
                <div>
                  <p className="text-xs font-medium">{p.name}</p>
                  <p className="text-[9px] text-[hsl(var(--muted))]">{p.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono">{p.tvlFormatted}</p>
                <p
                  className={`text-[9px] font-medium ${
                    p.riskLevel === "LOW"
                      ? "text-risk-low"
                      : p.riskLevel === "MEDIUM"
                        ? "text-risk-medium"
                        : "text-risk-high"
                  }`}
                >
                  Risk: {p.riskScore}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
