/**
 * Wallet Inbox — Activity Notifications
 *
 * Shows a bell icon with unread count badge. Dropdown lists all
 * wallet-specific events: bets placed, payouts, faucet funding,
 * World ID verification, market settlements. Events persist per
 * wallet address in localStorage.
 *
 * Sponsors: thirdweb (wallet identity), World ID, Chainlink CRE
 */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell,
  TrendingUp,
  TrendingDown,
  Droplets,
  Fingerprint,
  Zap,
  Trophy,
  ArrowDownToLine,
  X,
  Trash2,
} from "lucide-react";

export type InboxEvent = {
  id: string;
  type: "bet_yes" | "bet_no" | "payout_win" | "payout_loss" | "faucet" | "verified" | "settled" | "claimed";
  title: string;
  detail: string;
  timestamp: number;
  read: boolean;
  marketId?: number;
  amount?: string;
};

const STORAGE_KEY_PREFIX = "omni-inbox-";

function getStorageKey(address: string) {
  return STORAGE_KEY_PREFIX + address.toLowerCase();
}

export function getInboxEvents(address: string): InboxEvent[] {
  try {
    const raw = localStorage.getItem(getStorageKey(address));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function pushInboxEvent(address: string, event: Omit<InboxEvent, "id" | "timestamp" | "read">) {
  const events = getInboxEvents(address);
  const newEvent: InboxEvent = {
    ...event,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    read: false,
  };
  events.unshift(newEvent);
  // Keep max 50 events
  const trimmed = events.slice(0, 50);
  localStorage.setItem(getStorageKey(address), JSON.stringify(trimmed));
  // Dispatch custom event so Inbox component reacts immediately
  window.dispatchEvent(new CustomEvent("inbox-update", { detail: { address } }));
  return newEvent;
}

const EVENT_ICONS: Record<string, typeof Bell> = {
  bet_yes: TrendingUp,
  bet_no: TrendingDown,
  payout_win: Trophy,
  payout_loss: TrendingDown,
  faucet: Droplets,
  verified: Fingerprint,
  settled: Zap,
  claimed: ArrowDownToLine,
};

const EVENT_COLORS: Record<string, string> = {
  bet_yes: "text-risk-low",
  bet_no: "text-risk-critical",
  payout_win: "text-risk-low",
  payout_loss: "text-risk-critical",
  faucet: "text-[#7C3AED]",
  verified: "text-sentinel-400",
  settled: "text-sentinel-400",
  claimed: "text-risk-low",
};

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function Inbox({ address }: { address: string }) {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<InboxEvent[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const loadEvents = useCallback(() => {
    setEvents(getInboxEvents(address));
  }, [address]);

  // Load on mount and when address changes
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Listen for inbox-update custom events (fired by pushInboxEvent)
  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.address?.toLowerCase() === address.toLowerCase()) {
        loadEvents();
      }
    }
    window.addEventListener("inbox-update", handler);
    return () => window.removeEventListener("inbox-update", handler);
  }, [address, loadEvents]);

  // Close on click outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unreadCount = events.filter((e) => !e.read).length;

  function markAllRead() {
    const updated = events.map((e) => ({ ...e, read: true }));
    setEvents(updated);
    localStorage.setItem(getStorageKey(address), JSON.stringify(updated));
  }

  function clearAll() {
    setEvents([]);
    localStorage.removeItem(getStorageKey(address));
  }

  function handleOpen() {
    setOpen(!open);
    if (!open) {
      // Mark all as read when opening
      setTimeout(markAllRead, 1000);
    }
  }

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center rounded-lg border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-2 transition hover:border-sentinel-600/40"
      >
        <Bell className="h-3.5 w-3.5 text-[hsl(var(--muted))]" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-sentinel-500 px-1 text-[8px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[hsl(var(--card-border))] px-3 py-2.5">
            <span className="text-[11px] font-semibold">Activity</span>
            <div className="flex items-center gap-1.5">
              {events.length > 0 && (
                <button
                  onClick={clearAll}
                  className="rounded p-1 text-[hsl(var(--muted))] transition hover:bg-[hsl(var(--background))] hover:text-risk-critical"
                  title="Clear all"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded p-1 text-[hsl(var(--muted))] transition hover:bg-[hsl(var(--background))]"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Events list */}
          <div className="max-h-80 overflow-y-auto">
            {events.length === 0 ? (
              <div className="px-4 py-8 text-center text-[11px] text-[hsl(var(--muted))]">
                No activity yet. Place a bet or use the faucet to get started.
              </div>
            ) : (
              events.map((event) => {
                const Icon = EVENT_ICONS[event.type] ?? Bell;
                const color = EVENT_COLORS[event.type] ?? "text-[hsl(var(--muted))]";
                return (
                  <div
                    key={event.id}
                    className={`flex items-start gap-2.5 border-b border-[hsl(var(--card-border))]/50 px-3 py-2.5 transition last:border-0 ${
                      event.read ? "" : "bg-sentinel-600/5"
                    }`}
                  >
                    <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--background))] ${color}`}>
                      <Icon className="h-3 w-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold leading-tight">{event.title}</span>
                        {!event.read && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sentinel-500" />
                        )}
                      </div>
                      <p className="mt-0.5 text-[9px] leading-relaxed text-[hsl(var(--muted))]">{event.detail}</p>
                      <span className="mt-0.5 text-[8px] text-[hsl(var(--muted))]/60">{timeAgo(event.timestamp)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {events.length > 0 && (
            <div className="border-t border-[hsl(var(--card-border))] px-3 py-2 text-center">
              <span className="text-[9px] text-[hsl(var(--muted))]">
                {events.length} event{events.length !== 1 ? "s" : ""} for {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
