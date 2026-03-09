/**
 * Portfolio View
 *
 * Shows connected wallet address, World ID verification status,
 * position/market stats, and active bet positions pulled
 * from inbox events (localStorage). Listens for real-time updates
 * via the inbox-update custom DOM event.
 *
 * Sponsors: thirdweb (useActiveAccount, useWalletBalance), World ID (status display)
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useActiveAccount, useWalletBalance } from "thirdweb/react";
import { client } from "@/lib/thirdweb";
import { tenderlyVTestNet } from "@/lib/contracts";
import { getInboxEvents, type InboxEvent } from "@/components/Inbox";
import { Wallet, Shield, TrendingUp, TrendingDown, Trophy, Clock, ArrowUpDown } from "lucide-react";

type Position = {
  marketId: number;
  question: string;
  side: "YES" | "NO";
  amount: string;
  timestamp: number;
  status: "active" | "won" | "lost" | "claimed";
};

type StatusFilter = "all" | "active" | "won" | "lost" | "claimed";
type SortMode = "newest" | "amount" | "status";

function buildPositions(events: InboxEvent[]): Position[] {
  const posMap = new Map<number, Position>();

  // Walk events oldest-first to build final state
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e.type === "bet_yes" || e.type === "bet_no") {
      const marketId = e.marketId ?? 0;
      posMap.set(marketId, {
        marketId,
        question: e.detail.replace(/^Market #\d+:\s*/, ""),
        side: e.type === "bet_yes" ? "YES" : "NO",
        amount: e.amount ?? "0.01",
        timestamp: e.timestamp,
        status: "active",
      });
    }
    if (e.type === "settled" && e.marketId != null) {
      const pos = posMap.get(e.marketId);
      if (pos) {
        const outcomeYes = e.detail.toLowerCase().includes("outcome: yes");
        pos.status = (outcomeYes && pos.side === "YES") || (!outcomeYes && pos.side === "NO") ? "won" : "lost";
      }
    }
    if (e.type === "claimed" && e.marketId != null) {
      const pos = posMap.get(e.marketId);
      if (pos) pos.status = "claimed";
    }
  }

  return Array.from(posMap.values()).sort((a, b) => b.timestamp - a.timestamp);
}

function relativeTime(ts: number): string {
  const now = Date.now();
  const diffMs = now - ts;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

const STATUS_ORDER: Record<Position["status"], number> = {
  active: 0,
  won: 1,
  lost: 2,
  claimed: 3,
};

export function Portfolio({ isVerified }: { isVerified: boolean }) {
  const account = useActiveAccount();
  const { data: balanceData } = useWalletBalance({
    chain: tenderlyVTestNet,
    address: account?.address,
    client,
  });
  const [positions, setPositions] = useState<Position[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const loadPositions = useCallback(() => {
    if (!account?.address) return;
    const events = getInboxEvents(account.address);
    setPositions(buildPositions(events));
  }, [account?.address]);

  useEffect(() => {
    loadPositions();
  }, [loadPositions]);

  useEffect(() => {
    if (!account?.address) return;
    function handler(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.address?.toLowerCase() === account!.address.toLowerCase()) {
        loadPositions();
      }
    }
    window.addEventListener("inbox-update", handler);
    return () => window.removeEventListener("inbox-update", handler);
  }, [account?.address, loadPositions]);

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
  const totalStaked = positions.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const ethBalance = balanceData ? parseFloat(balanceData.displayValue).toFixed(4) : "---";

  // Filter positions
  const filtered = statusFilter === "all"
    ? positions
    : positions.filter((p) => p.status === statusFilter);

  // Sort positions
  const sorted = [...filtered].sort((a, b) => {
    switch (sortMode) {
      case "newest":
        return b.timestamp - a.timestamp;
      case "amount":
        return parseFloat(b.amount) - parseFloat(a.amount);
      case "status":
        return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      default:
        return 0;
    }
  });

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "won", label: "Won" },
    { value: "lost", label: "Lost" },
    { value: "claimed", label: "Claimed" },
  ];

  const sortOptions: { value: SortMode; label: string }[] = [
    { value: "newest", label: "Newest" },
    { value: "amount", label: "Amount" },
    { value: "status", label: "Status" },
  ];

  return (
    <div className="space-y-4">
      {/* Wallet info */}
      <div className="flex items-center gap-3 rounded-lg bg-[hsl(var(--background))] p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sentinel-600/10">
          <Wallet className="h-4 w-4 text-sentinel-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-mono text-xs">{shortAddr}</p>
            <span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[8px] font-semibold text-purple-400">
              via thirdweb
            </span>
          </div>
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
          <p className="text-sm font-bold">{positions.length}</p>
        </div>
        <div className="rounded-lg bg-[hsl(var(--background))] p-2.5 text-center">
          <p className="text-[9px] text-[hsl(var(--muted))]">Total Staked</p>
          <p className="text-sm font-bold">{totalStaked.toFixed(3)}</p>
          <p className="text-[8px] text-[hsl(var(--muted))]">ETH</p>
        </div>
        <div className="rounded-lg bg-[hsl(var(--background))] p-2.5 text-center">
          <p className="text-[9px] text-[hsl(var(--muted))]">Balance</p>
          <p className="text-sm font-bold">{ethBalance}</p>
          <p className="text-[8px] text-[hsl(var(--muted))]">ETH</p>
        </div>
      </div>

      {/* Position filters */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium text-[hsl(var(--muted))]">
            Your Positions
          </p>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-2.5 w-2.5 text-[hsl(var(--muted))]" />
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSortMode(opt.value)}
                className={`rounded px-1.5 py-0.5 text-[8px] font-medium transition-colors ${
                  sortMode === opt.value
                    ? "bg-sentinel-600/20 text-sentinel-400"
                    : "text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status filter pills */}
        <div className="flex gap-1">
          {filterOptions.map((opt) => {
            const count = opt.value === "all"
              ? positions.length
              : positions.filter((p) => p.status === opt.value).length;
            return (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`rounded-full px-2 py-0.5 text-[9px] font-medium transition-colors ${
                  statusFilter === opt.value
                    ? "bg-sentinel-600/20 text-sentinel-400"
                    : "bg-[hsl(var(--background))] text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                }`}
              >
                {opt.label} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Positions list */}
      <div>
        {sorted.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[hsl(var(--card-border))] px-4 py-6 text-center">
            <p className="text-[11px] text-[hsl(var(--muted))]">
              {positions.length === 0 ? "No positions yet" : "No matching positions"}
            </p>
            <p className="mt-1 text-[9px] text-[hsl(var(--muted))]/60">
              {positions.length === 0
                ? "Place a bet on a prediction market to see it here"
                : "Try changing the filter above"}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {sorted.map((pos) => {
              const statusConfig = {
                active: { label: "Active", color: "text-sentinel-400", bg: "bg-sentinel-600/10", icon: Clock },
                won: { label: "Won", color: "text-risk-low", bg: "bg-risk-low/10", icon: Trophy },
                lost: { label: "Lost", color: "text-risk-critical", bg: "bg-risk-critical/10", icon: TrendingDown },
                claimed: { label: "Claimed", color: "text-risk-low", bg: "bg-risk-low/10", icon: Trophy },
              }[pos.status];
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={pos.marketId}
                  className="rounded-lg border border-[hsl(var(--card-border))] p-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium leading-tight">
                        {pos.question}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                            pos.side === "YES"
                              ? "bg-risk-low/10 text-risk-low"
                              : "bg-risk-critical/10 text-risk-critical"
                          }`}
                        >
                          {pos.side === "YES" ? (
                            <TrendingUp className="h-2.5 w-2.5" />
                          ) : (
                            <TrendingDown className="h-2.5 w-2.5" />
                          )}
                          {pos.side}
                        </span>
                        <span className="text-[12px] font-mono font-bold text-[hsl(var(--foreground))]">
                          {pos.amount} ETH
                        </span>
                      </div>
                      <p className="mt-1 text-[8px] text-[hsl(var(--muted))]">
                        <Clock className="mr-0.5 inline h-2 w-2" />
                        {relativeTime(pos.timestamp)}
                      </p>
                    </div>
                    <span
                      className={`flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium ${statusConfig.bg} ${statusConfig.color}`}
                    >
                      <StatusIcon className="h-2.5 w-2.5" />
                      {statusConfig.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
