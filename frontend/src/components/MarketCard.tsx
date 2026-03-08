/**
 * Prediction Market Card
 *
 * Individual market card with YES/NO betting, pool visualization,
 * countdown timer, and multi-currency display. Requires World ID
 * verification to place bets. CRE MarketSettler resolves expired markets.
 * Supports configurable decimal precision and display currency conversion.
 *
 * Sponsors: World ID (sybil gate), Chainlink CRE (settlement)
 */
"use client";

import { useState, useEffect } from "react";
import { Clock, Lock, Users, Zap } from "lucide-react";

type Market = {
  id: number;
  question: string;
  deadline: number;
  yesPool: number;
  noPool: number;
  resolved: boolean;
  category: string;
  protocol: string;
};

// Approximate conversion rates from ETH (for display purposes)
const ETH_RATES: Record<string, { rate: number; symbol: string }> = {
  ETH: { rate: 1, symbol: "ETH" },
  BTC: { rate: 0.055, symbol: "BTC" },
  USD: { rate: 2150, symbol: "$" },
  EUR: { rate: 1980, symbol: "\u20AC" },
  GBP: { rate: 1700, symbol: "\u00A3" },
  JPY: { rate: 322000, symbol: "\u00A5" },
};

function formatConverted(ethAmount: number, currency: string, precision: number): string {
  const info = ETH_RATES[currency];
  if (!info || currency === "ETH") return "";
  const converted = ethAmount * info.rate;
  if (currency === "BTC") return `${info.symbol} ${converted.toFixed(precision + 2)}`;
  if (["USD", "EUR", "GBP"].includes(currency)) return `${info.symbol}${converted.toFixed(2)}`;
  return `${info.symbol}${Math.round(converted).toLocaleString()}`;
}

export function MarketCard({
  market,
  isVerified,
  onBet,
  decimalPrecision = 3,
  displayCurrency = "ETH",
}: {
  market: Market;
  isVerified: boolean;
  onBet?: (marketId: number, isYes: boolean, amount: number) => void;
  decimalPrecision?: number;
  displayCurrency?: string;
}) {
  const [stakeAmount, setStakeAmount] = useState("0.01");
  const [localYes, setLocalYes] = useState(market.yesPool);
  const [localNo, setLocalNo] = useState(market.noPool);
  const [userBet, setUserBet] = useState<"yes" | "no" | null>(null);
  const [betting, setBetting] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Math.floor(Date.now() / 1000));
  }, []);

  const totalPool = localYes + localNo;
  const yesPct = totalPool > 0 ? (localYes / totalPool) * 100 : 50;
  const noPct = 100 - yesPct;

  const timeLeft = now > 0 ? market.deadline - now : market.deadline - market.deadline;
  const daysLeft = Math.max(0, Math.floor(timeLeft / 86400));
  const hoursLeft = Math.max(0, Math.floor((timeLeft % 86400) / 3600));
  const isExpired = now > 0 && timeLeft <= 0;

  function handleBet(isYes: boolean) {
    if (!isVerified) return;
    const amount = parseFloat(stakeAmount) || 0.01;
    setBetting(true);

    // Simulate transaction delay
    setTimeout(() => {
      if (isYes) {
        setLocalYes((prev) => prev + amount);
      } else {
        setLocalNo((prev) => prev + amount);
      }
      setUserBet(isYes ? "yes" : "no");
      setBetting(false);
      onBet?.(market.id, isYes, amount);
    }, 800);
  }

  const categoryColors: Record<string, string> = {
    TVL: "bg-[#B6509E]/10 text-[#B6509E]",
    Staking: "bg-[#00A3FF]/10 text-[#00A3FF]",
    Safety: "bg-risk-high/10 text-risk-high",
    Stability: "bg-risk-low/10 text-risk-low",
    Market: "bg-sentinel-600/10 text-sentinel-400",
  };

  return (
    <div className={`group rounded-xl border bg-[hsl(var(--card))] p-4 transition-all ${
      userBet ? "border-sentinel-600/40" : "border-[hsl(var(--card-border))] hover:border-[hsl(var(--card-border))]/80"
    }`}>
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${categoryColors[market.category] ?? categoryColors.Market}`}>
            {market.category}
          </span>
          <span className="text-[9px] text-[hsl(var(--muted))]">{market.protocol}</span>
        </div>
        {isExpired ? (
          <span className="risk-badge bg-risk-high/10 text-risk-high">Ended</span>
        ) : (
          <span className="risk-badge bg-risk-low/10 text-risk-low">Live</span>
        )}
      </div>

      {/* Question */}
      <p className="mb-3 text-[13px] font-medium leading-snug">{market.question}</p>

      {/* Pool visualization */}
      <div className="mb-2">
        <div className="mb-1 flex justify-between text-[10px] font-semibold">
          <span className="text-risk-low">YES {yesPct.toFixed(0)}%</span>
          <span className="text-risk-critical">NO {noPct.toFixed(0)}%</span>
        </div>
        <div className="flex h-2.5 overflow-hidden rounded-full bg-[hsl(var(--background))]">
          <div
            className="rounded-l-full bg-risk-low/80 transition-all duration-500"
            style={{ width: `${yesPct}%` }}
          />
          <div className="w-px bg-[hsl(var(--card))]" />
          <div
            className="rounded-r-full bg-risk-critical/80 transition-all duration-500"
            style={{ width: `${noPct}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-[hsl(var(--muted))]">
          <div>
            <span>{localYes.toFixed(decimalPrecision)} <span className="text-[8px] font-medium text-sentinel-400">ETH</span></span>
            {displayCurrency !== "ETH" && (
              <span className="ml-1 text-[8px] opacity-60">{formatConverted(localYes, displayCurrency, decimalPrecision)}</span>
            )}
          </div>
          <div>
            <span>{localNo.toFixed(decimalPrecision)} <span className="text-[8px] font-medium text-sentinel-400">ETH</span></span>
            {displayCurrency !== "ETH" && (
              <span className="ml-1 text-[8px] opacity-60">{formatConverted(localNo, displayCurrency, decimalPrecision)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Time + participants */}
      <div className="mb-3 flex items-center justify-between text-[10px] text-[hsl(var(--muted))]">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {isExpired ? "Expired" : `${daysLeft}d ${hoursLeft}h left`}
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {Math.floor(totalPool * 10) + 3} positions
        </span>
      </div>

      {/* User's bet indicator */}
      {userBet && (
        <div className={`mb-2 rounded-lg px-2.5 py-1.5 text-[10px] font-medium ${
          userBet === "yes" ? "bg-risk-low/10 text-risk-low" : "bg-risk-critical/10 text-risk-critical"
        }`}>
          Your position: {userBet.toUpperCase()} ({stakeAmount} <span className="font-semibold text-sentinel-400">ETH</span>)
          {displayCurrency !== "ETH" && (
            <span className="ml-1 opacity-60 text-[9px]">{formatConverted(parseFloat(stakeAmount) || 0, displayCurrency, decimalPrecision)}</span>
          )}
        </div>
      )}

      {/* Actions */}
      {!isExpired && !userBet && (
        <div className="space-y-2">
          {!isVerified && (
            <div className="flex items-center gap-1.5 rounded-lg bg-risk-critical/5 border border-risk-critical/10 px-2.5 py-2 text-[10px] text-risk-critical">
              <Lock className="h-3 w-3 shrink-0" />
              <span>Verify with World ID to place predictions</span>
            </div>
          )}
          <div className="flex gap-1.5">
            <div className="flex items-center gap-1 rounded-lg border border-[hsl(var(--card-border))] bg-transparent px-2 py-1.5 focus-within:border-sentinel-500">
              <input
                type="number"
                step="0.01"
                min="0.001"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className="w-14 bg-transparent text-xs outline-none"
                placeholder="0.01 ETH"
              />
              <span className="text-[9px] font-medium text-sentinel-400">ETH</span>
            </div>
            <button
              onClick={() => handleBet(true)}
              disabled={!isVerified || betting}
              className="flex-1 rounded-lg bg-risk-low/15 py-1.5 text-xs font-semibold text-risk-low transition hover:bg-risk-low/25 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {betting ? "..." : "YES"}
            </button>
            <button
              onClick={() => handleBet(false)}
              disabled={!isVerified || betting}
              className="flex-1 rounded-lg bg-risk-critical/15 py-1.5 text-xs font-semibold text-risk-critical transition hover:bg-risk-critical/25 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {betting ? "..." : "NO"}
            </button>
          </div>
        </div>
      )}

      {isExpired && !market.resolved && (
        <button className="btn-outline w-full text-xs flex items-center justify-center gap-1.5">
          <Zap className="h-3 w-3" />
          Request CRE Settlement
        </button>
      )}
    </div>
  );
}
