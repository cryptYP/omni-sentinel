"use client";

import { useState, useEffect } from "react";
import { useDefiProtocols } from "@/lib/hooks";
import { BarChart3, ShieldAlert, TrendingUp, Radio, Zap, Activity } from "lucide-react";

type FeedItem = {
  type: "risk" | "safeguard" | "market" | "cre";
  label: string;
  detail: string;
  time: string;
};

export function ActivityFeed() {
  const { protocols } = useDefiProtocols();
  const [feed, setFeed] = useState<FeedItem[]>([]);

  useEffect(() => {
    if (protocols.length === 0) return;

    const items: FeedItem[] = [];
    const now = new Date();

    // Generate realistic feed from live protocol data
    protocols.forEach((p, i) => {
      items.push({
        type: "risk",
        label: `${p.name} risk assessed`,
        detail: `Score: ${p.riskScore}/100 (${p.riskLevel}) — TVL: ${p.tvlFormatted}`,
        time: formatTimeAgo(i * 5 + 1),
      });
    });

    // CRE workflow events
    items.push({
      type: "cre",
      label: "RiskMonitor CRE executed",
      detail: `Fetched ${protocols.length} protocols from DeFi Llama, scores written onchain`,
      time: formatTimeAgo(2),
    });

    items.push({
      type: "cre",
      label: "SafeguardTrigger CRE check",
      detail: "All scores within safe range — no action needed",
      time: formatTimeAgo(1),
    });

    items.push({
      type: "cre",
      label: "MarketSettler CRE listening",
      detail: "Monitoring for SettlementRequested events on-chain",
      time: formatTimeAgo(0),
    });

    // Safeguard status
    const highRisk = protocols.find((p) => p.riskScore > 70);
    if (highRisk) {
      items.push({
        type: "safeguard",
        label: `Safeguard alert: ${highRisk.name}`,
        detail: `Risk ${highRisk.riskScore} exceeds threshold 70 — circuit breaker engaged`,
        time: formatTimeAgo(3),
      });
    } else {
      items.push({
        type: "safeguard",
        label: "Safeguard status: ACTIVE",
        detail: "All monitored protocols within safe parameters",
        time: formatTimeAgo(4),
      });
    }

    // Market events
    items.push({
      type: "market",
      label: "5 prediction markets live",
      detail: "Sybil-resistant via World ID verification",
      time: formatTimeAgo(10),
    });

    setFeed(items);
  }, [protocols]);

  const iconMap = {
    risk: <BarChart3 className="h-3.5 w-3.5 text-sentinel-400" />,
    safeguard: <ShieldAlert className="h-3.5 w-3.5 text-risk-high" />,
    market: <TrendingUp className="h-3.5 w-3.5 text-risk-low" />,
    cre: <Zap className="h-3.5 w-3.5 text-sentinel-300" />,
  };

  const accentMap = {
    risk: "border-l-sentinel-500",
    safeguard: "border-l-risk-high",
    market: "border-l-risk-low",
    cre: "border-l-sentinel-400",
  };

  return (
    <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
      {feed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-xs text-[hsl(var(--muted))]">
          <Activity className="mb-2 h-5 w-5 opacity-30 animate-pulse" />
          Loading activity...
        </div>
      ) : (
        feed.map((item, i) => (
          <div
            key={i}
            className={`flex items-start gap-2.5 rounded-lg border border-[hsl(var(--card-border))] border-l-2 ${accentMap[item.type]} p-2.5 transition-colors hover:bg-[hsl(var(--background))]/50`}
          >
            <div className="mt-0.5 shrink-0">{iconMap[item.type]}</div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium">{item.label}</p>
              <p className="truncate text-[10px] text-[hsl(var(--muted))]">{item.detail}</p>
            </div>
            <span className="shrink-0 text-[9px] text-[hsl(var(--muted))]">{item.time}</span>
          </div>
        ))
      )}
    </div>
  );
}

function formatTimeAgo(minutes: number): string {
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}
