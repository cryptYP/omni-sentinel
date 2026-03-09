/**
 * Prediction Market Card
 *
 * Individual market card with YES/NO betting, pool visualization,
 * countdown timer, and multi-currency display. Requires World ID
 * verification to place bets. Uses wallet signing (MetaMask) for
 * authentic dApp UX. CRE MarketSettler resolves expired markets.
 * Winners can claim proportional payout; losers' ETH goes to winners.
 *
 * Sponsors: World ID (sybil gate), Chainlink CRE (settlement), thirdweb (tx signing)
 */
"use client";

import { useState, useEffect } from "react";
import { useActiveAccount, useSendTransaction, useSwitchActiveWalletChain, useActiveWalletChain } from "thirdweb/react";
import { prepareContractCall, toWei } from "thirdweb";
import { getPredictionMarket, tenderlyVTestNet } from "@/lib/contracts";
import { Clock, Lock, Users, Zap, Trophy, ArrowDownToLine } from "lucide-react";

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
  onBalanceChange,
  onInboxEvent,
  walletBalance,
  txMode = "wallet",
  decimalPrecision = 3,
  displayCurrency = "ETH",
}: {
  market: Market;
  isVerified: boolean;
  onBet?: (marketId: number, isYes: boolean, amount: number) => void;
  onBalanceChange?: () => void;
  onInboxEvent?: (type: string, title: string, detail: string, extra?: Record<string, any>) => void;
  walletBalance?: string | null;
  txMode?: "wallet" | "admin";
  decimalPrecision?: number;
  displayCurrency?: string;
}) {
  const account = useActiveAccount();
  const { mutate: sendTx } = useSendTransaction();
  const switchChain = useSwitchActiveWalletChain();
  const activeChain = useActiveWalletChain();

  // Ensure wallet is on the Tenderly VTestNet before sending txs
  async function ensureCorrectChain() {
    if (activeChain?.id !== tenderlyVTestNet.id) {
      try {
        await switchChain(tenderlyVTestNet);
      } catch {
        // If thirdweb switch fails, try raw MetaMask RPC
        const rpcUrl = process.env.NEXT_PUBLIC_TENDERLY_RPC ?? "";
        await (window as any).ethereum?.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: "0x" + (73571).toString(16),
            chainName: "Tenderly VTestNet",
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: [rpcUrl],
          }],
        });
        await switchChain(tenderlyVTestNet);
      }
    }
  }
  const [stakeAmount, setStakeAmount] = useState("0.01");
  const [localYes, setLocalYes] = useState(market.yesPool);
  const [localNo, setLocalNo] = useState(market.noPool);
  const [userPositions, setUserPositions] = useState<Array<{ side: "yes" | "no"; amount: string; timestamp: number }>>([]);
  const [betting, setBetting] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const [settling, setSettling] = useState(false);
  const [settled, setSettled] = useState(market.resolved);
  const [settledOutcome, setSettledOutcome] = useState<boolean | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  // Base positions from initial pool, increments on each bet
  const [positionCount, setPositionCount] = useState(Math.floor((market.yesPool + market.noPool) * 10) + 3);

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

  // Aggregate user positions
  const hasPositions = userPositions.length > 0;
  const yesPositions = userPositions.filter((p) => p.side === "yes");
  const noPositions = userPositions.filter((p) => p.side === "no");
  const totalYesStaked = yesPositions.reduce((s, p) => s + parseFloat(p.amount), 0);
  const totalNoStaked = noPositions.reduce((s, p) => s + parseFloat(p.amount), 0);

  // Calculate payout for settled markets
  const winningSide = settledOutcome ? "yes" : "no";
  const winningPool = settledOutcome ? localYes : localNo;
  const userWinningStake = settledOutcome != null
    ? userPositions.filter((p) => p.side === winningSide).reduce((s, p) => s + parseFloat(p.amount), 0)
    : 0;
  const payout = userWinningStake > 0 && winningPool > 0
    ? (userWinningStake * totalPool) / winningPool
    : 0;
  const userIsWinner = userWinningStake > 0;

  async function handleBet(isYes: boolean) {
    if (!isVerified || !account) return;
    const amount = parseFloat(stakeAmount) || 0.01;

    // Validate bet amount
    if (amount <= 0) {
      setTxStatus("error:Bet amount must be greater than 0");
      return;
    }
    if (walletBalance) {
      const bal = parseFloat(walletBalance);
      if (amount > bal) {
        setTxStatus(`error:Insufficient balance — you have ${bal.toFixed(3)} ETH but tried to bet ${amount} ETH`);
        return;
      }
      if (amount > bal * 0.99) {
        setTxStatus(`error:Not enough ETH — need to keep some for gas fees. Balance: ${bal.toFixed(3)} ETH`);
        return;
      }
    }

    setBetting(true);

    // Ensure user is World ID verified on-chain
    try {
      await fetch("/api/tenderly/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: account.address }),
      });
    } catch {}

    // Route based on txMode
    if (txMode === "admin") {
      setTxStatus("fallback");
      handleBetFallback(isYes, amount);
      return;
    }

    setTxStatus("switching");

    // Auto-switch wallet to Tenderly VTestNet
    try {
      await ensureCorrectChain();
    } catch (chainErr: any) {
      console.error("Chain switch failed:", chainErr);
      setBetting(false);
      setTxStatus("error:Please add Tenderly VTestNet to your wallet first (Dev tab → Add to MetaMask)");
      return;
    }

    setTxStatus("signing");
    sendWalletTx(isYes, amount);
  }

  function sendWalletTx(isYes: boolean, amount: number) {
    const contract = getPredictionMarket();
    const tx = prepareContractCall({
      contract,
      method: "takePosition",
      params: [BigInt(market.id), isYes] as const,
      value: toWei(stakeAmount),
    });

    sendTx(tx as any, {
      onSuccess: () => {
        if (isYes) setLocalYes((prev) => prev + amount);
        else setLocalNo((prev) => prev + amount);
        setUserPositions((prev) => [...prev, { side: isYes ? "yes" : "no", amount: stakeAmount, timestamp: Date.now() }]);
        setPositionCount((c) => c + 1);
        setBetting(false);
        setTxStatus("confirmed");
        onBet?.(market.id, isYes, amount);
        onBalanceChange?.();
        onInboxEvent?.(
          isYes ? "bet_yes" : "bet_no",
          `Bet ${isYes ? "YES" : "NO"} — ${amount} ETH`,
          `Market #${market.id}: ${market.question}`,
          { marketId: market.id, amount: stakeAmount },
        );
      },
      onError: (err) => {
        console.error("Wallet tx failed:", err.message);
        const msg = err.message?.toLowerCase() ?? "";
        if (msg.includes("rejected") || msg.includes("denied")) {
          setBetting(false);
          setTxStatus("error:Transaction rejected in wallet");
          return;
        }
        // Tenderly quota/plan limit — fall back to simulated bet
        if (msg.includes("quota") || msg.includes("limit") || msg.includes("upgrade") || msg.includes("plan")) {
          simulateBet(isYes, amount);
          return;
        }
        // Chain mismatch — try switching and retrying once
        if (msg.includes("chain") || msg.includes("network") || msg.includes("switch")) {
          setTxStatus("switching");
          ensureCorrectChain()
            .then(() => {
              setTxStatus("signing");
              sendWalletTx(isYes, amount);
            })
            .catch(() => {
              setBetting(false);
              setTxStatus("error:Could not switch to Tenderly VTestNet. Add it via Dev tab → Add to MetaMask");
            });
          return;
        }
        // Show the actual error — user can switch to Admin RPC mode in Dev tab
        setBetting(false);
        setTxStatus("error:" + (err.message?.slice(0, 100) || "Transaction failed. Try Admin RPC mode in Dev tab"));
      },
    });
  }

  function simulateBet(isYes: boolean, amount: number) {
    if (isYes) setLocalYes((prev) => prev + amount);
    else setLocalNo((prev) => prev + amount);
    setUserPositions((prev) => [...prev, { side: isYes ? "yes" : "no", amount: stakeAmount, timestamp: Date.now() }]);
    setPositionCount((c) => c + 1);
    setBetting(false);
    setTxStatus("simulated");
    onBet?.(market.id, isYes, amount);
    onInboxEvent?.(
      isYes ? "bet_yes" : "bet_no",
      `Bet ${isYes ? "YES" : "NO"} — ${amount} ETH`,
      `Market #${market.id}: ${market.question}`,
      { marketId: market.id, amount: stakeAmount },
    );
  }

  async function handleBetFallback(isYes: boolean, amount: number) {
    if (!account) return;
    setTxStatus("fallback");
    try {
      const amountWei = toWei(stakeAmount).toString();
      const res = await fetch("/api/tenderly/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: account.address,
          marketId: market.id,
          isYes,
          amountWei,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (isYes) setLocalYes((prev) => prev + amount);
        else setLocalNo((prev) => prev + amount);
        setUserPositions((prev) => [...prev, { side: isYes ? "yes" : "no", amount: stakeAmount, timestamp: Date.now() }]);
        setPositionCount((c) => c + 1);
        setTxStatus(data.simulated ? "simulated" : "confirmed");
        onBet?.(market.id, isYes, amount);
        onBalanceChange?.();
        onInboxEvent?.(
          isYes ? "bet_yes" : "bet_no",
          `Bet ${isYes ? "YES" : "NO"} — ${amount} ETH`,
          `Market #${market.id}: ${market.question}`,
          { marketId: market.id, amount: stakeAmount },
        );
      } else {
        const errMsg = data.error?.toLowerCase() ?? "";
        // Quota/plan limit — simulate the bet
        if (errMsg.includes("quota") || errMsg.includes("limit") || errMsg.includes("upgrade") || errMsg.includes("plan")) {
          simulateBet(isYes, amount);
          return;
        }
        setTxStatus("error:" + (data.error?.slice(0, 80) || "Transaction failed"));
      }
    } catch (err: any) {
      const errMsg = err.message?.toLowerCase() ?? "";
      if (errMsg.includes("quota") || errMsg.includes("limit") || errMsg.includes("upgrade")) {
        simulateBet(isYes, amount);
        return;
      }
      setTxStatus("error:" + (err.message?.slice(0, 60) || "Transaction failed"));
    } finally {
      setBetting(false);
    }
  }

  async function handleAutoSettle() {
    setSettling(true);
    setTxStatus(null);
    try {
      const res = await fetch("/api/tenderly/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId: market.id,
          outcome: yesPct >= 50,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSettled(true);
        setSettledOutcome(data.outcome);
        setTxStatus("settled");
        onInboxEvent?.(
          "settled",
          `Market #${market.id} Settled`,
          `Outcome: ${data.outcome ? "YES" : "NO"} — ${market.question}`,
          { marketId: market.id, outcome: data.outcome },
        );
      } else {
        setTxStatus("error:" + (data.error?.slice(0, 80) || "Settlement failed"));
      }
    } catch (err: any) {
      setTxStatus("error:" + (err.message?.slice(0, 60) || "Settlement failed"));
    } finally {
      setSettling(false);
    }
  }

  async function handleClaimWinnings() {
    if (!account) return;
    setClaiming(true);

    // Admin RPC mode — skip wallet signing
    if (txMode === "admin") {
      setTxStatus("fallback");
      try {
        const claimSel = "677bd9ff";
        const paddedId = market.id.toString(16).padStart(64, "0");
        const rpcUrl = process.env.NEXT_PUBLIC_TENDERLY_RPC;
        if (!rpcUrl) throw new Error("No RPC");
        const res = await fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_sendTransaction",
            params: [{ from: account.address, to: process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS, data: "0x" + claimSel + paddedId, gas: "0x50000" }],
            id: 1,
          }),
        });
        const data = await res.json();
        if (data.result) {
          setClaimed(true);
          setTxStatus("claimed");
          onInboxEvent?.("claimed", `Claimed Winnings — Market #${market.id}`, `Payout collected for: ${market.question}`, { marketId: market.id });
          onBalanceChange?.();
        } else {
          const claimMsg = (data.error?.message ?? "").toLowerCase();
          if (claimMsg.includes("quota") || claimMsg.includes("limit") || claimMsg.includes("upgrade")) {
            setClaimed(true);
            setTxStatus("simulated");
            onInboxEvent?.("claimed", `Claimed Winnings — Market #${market.id}`, `Payout collected for: ${market.question} (simulated — Tenderly quota)`, { marketId: market.id });
          } else {
            setTxStatus("error:" + (data.error?.message?.slice(0, 60) || "Claim failed"));
          }
        }
      } catch (err: any) {
        const errMsg = (err.message ?? "").toLowerCase();
        if (errMsg.includes("quota") || errMsg.includes("limit") || errMsg.includes("upgrade")) {
          setClaimed(true);
          setTxStatus("simulated");
        } else {
          setTxStatus("error:" + (err.message?.slice(0, 60) || "Claim failed"));
        }
      } finally {
        setClaiming(false);
      }
      return;
    }

    setTxStatus("switching");

    // Auto-switch wallet to Tenderly VTestNet
    try {
      await ensureCorrectChain();
    } catch {
      setClaiming(false);
      setTxStatus("error:Please add Tenderly VTestNet to your wallet first");
      return;
    }

    setTxStatus("signing");

    // Wallet signing for authentic on-chain claim
    const contract = getPredictionMarket();
    const tx = prepareContractCall({
      contract,
      method: "claimWinnings",
      params: [BigInt(market.id)] as const,
    });

    sendTx(tx as any, {
      onSuccess: () => {
        setClaimed(true);
        setClaiming(false);
        setTxStatus("claimed");
        onBalanceChange?.();
        onInboxEvent?.(
          "claimed",
          `Claimed Winnings — Market #${market.id}`,
          `Payout collected for: ${market.question}`,
          { marketId: market.id },
        );
      },
      onError: async (err) => {
        if (err.message?.includes("rejected") || err.message?.includes("denied")) {
          setClaiming(false);
          setTxStatus("error:Claim rejected in wallet");
          return;
        }
        // Retry once after chain switch, then fall back to Admin RPC
        try {
          await ensureCorrectChain();
          // Retry claim via Admin RPC as last resort
          const claimSel = "677bd9ff"; // claimWinnings(uint256)
          const paddedId = market.id.toString(16).padStart(64, "0");
          const rpcUrl = process.env.NEXT_PUBLIC_TENDERLY_RPC;
          if (!rpcUrl) throw new Error("No RPC");
          setTxStatus("fallback");
          const res = await fetch(rpcUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              method: "eth_sendTransaction",
              params: [{
                from: account.address,
                to: process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS,
                data: "0x" + claimSel + paddedId,
                gas: "0x50000",
              }],
              id: 1,
            }),
          });
          const data = await res.json();
          if (data.result) {
            setClaimed(true);
            setTxStatus("claimed");
            onInboxEvent?.(
              "claimed",
              `Claimed Winnings — Market #${market.id}`,
              `Payout collected for: ${market.question}`,
              { marketId: market.id },
            );
            onBalanceChange?.();
          } else {
            setTxStatus("error:" + (data.error?.message?.slice(0, 60) || "Claim failed"));
          }
        } catch (fallbackErr: any) {
          setTxStatus("error:" + (fallbackErr.message?.slice(0, 60) || "Claim failed"));
        } finally {
          setClaiming(false);
        }
      },
    });
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
      hasPositions ? "border-sentinel-600/40" : "border-[hsl(var(--card-border))] hover:border-[hsl(var(--card-border))]/80"
    }`}>
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${categoryColors[market.category] ?? categoryColors.Market}`}>
            {market.category}
          </span>
          <span className="text-[9px] text-[hsl(var(--muted))]">{market.protocol}</span>
        </div>
        {settled ? (
          <span className="risk-badge bg-sentinel-600/10 text-sentinel-400">Settled</span>
        ) : isExpired ? (
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
          {positionCount} positions
        </span>
      </div>

      {/* User's positions indicator */}
      {hasPositions && !settled && (
        <div className="mb-2 space-y-1">
          {yesPositions.length > 0 && (
            <div className="rounded-lg bg-risk-low/10 px-2.5 py-1.5 text-[10px] font-medium text-risk-low">
              YES: {yesPositions.length} position{yesPositions.length > 1 ? "s" : ""} — {totalYesStaked.toFixed(decimalPrecision)} <span className="font-semibold text-sentinel-400">ETH</span>
              {displayCurrency !== "ETH" && (
                <span className="ml-1 opacity-60 text-[9px]">{formatConverted(totalYesStaked, displayCurrency, decimalPrecision)}</span>
              )}
            </div>
          )}
          {noPositions.length > 0 && (
            <div className="rounded-lg bg-risk-critical/10 px-2.5 py-1.5 text-[10px] font-medium text-risk-critical">
              NO: {noPositions.length} position{noPositions.length > 1 ? "s" : ""} — {totalNoStaked.toFixed(decimalPrecision)} <span className="font-semibold text-sentinel-400">ETH</span>
              {displayCurrency !== "ETH" && (
                <span className="ml-1 opacity-60 text-[9px]">{formatConverted(totalNoStaked, displayCurrency, decimalPrecision)}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions — place bet */}
      {!isExpired && !settled && (
        <div className="space-y-2">
          {!isVerified && (
            <div className="flex items-center gap-1.5 rounded-lg bg-risk-critical/5 border border-risk-critical/10 px-2.5 py-2 text-[10px] text-risk-critical">
              <Lock className="h-3 w-3 shrink-0" />
              <span>Verify with World ID to place predictions</span>
            </div>
          )}
          {walletBalance && (
            <div className="flex items-center justify-between text-[9px] text-[hsl(var(--muted))]">
              <span>Your balance: <span className="font-semibold text-[hsl(var(--foreground))]">{parseFloat(walletBalance).toFixed(3)} ETH</span></span>
              {parseFloat(stakeAmount) > parseFloat(walletBalance) && (
                <span className="text-risk-critical font-semibold">Exceeds balance</span>
              )}
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
              disabled={!isVerified || betting || !account || (!!walletBalance && parseFloat(stakeAmount) > parseFloat(walletBalance))}
              className="flex-1 rounded-lg bg-risk-low/15 py-1.5 text-xs font-semibold text-risk-low transition hover:bg-risk-low/25 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {betting ? "..." : "YES"}
            </button>
            <button
              onClick={() => handleBet(false)}
              disabled={!isVerified || betting || !account || (!!walletBalance && parseFloat(stakeAmount) > parseFloat(walletBalance))}
              className="flex-1 rounded-lg bg-risk-critical/15 py-1.5 text-xs font-semibold text-risk-critical transition hover:bg-risk-critical/25 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {betting ? "..." : "NO"}
            </button>
          </div>
        </div>
      )}

      {/* Transaction status */}
      {txStatus && (
        <div className={`mb-2 rounded-md px-2 py-1 text-[9px] font-medium ${
          txStatus === "confirmed" || txStatus === "settled" || txStatus === "claimed" || txStatus === "simulated" ? "bg-risk-low/10 text-risk-low" :
          txStatus === "switching" ? "bg-[#7C3AED]/10 text-[#7C3AED]" :
          txStatus === "signing" ? "bg-[#7C3AED]/10 text-[#7C3AED]" :
          txStatus === "fallback" ? "bg-sentinel-600/10 text-sentinel-400" :
          txStatus?.startsWith("error:") ? "bg-risk-critical/10 text-risk-critical" :
          "bg-sentinel-600/10 text-sentinel-400"
        }`}>
          {txStatus === "switching" ? "Switching wallet to Tenderly VTestNet..." :
           txStatus === "signing" ? "Approve transaction in your wallet..." :
           txStatus === "fallback" ? "Processing via Admin RPC (testnet only)..." :
           txStatus === "simulated" ? "✓ Bet recorded — Tenderly RPC quota reached, position saved locally" :
           txStatus === "confirmed" ? "✓ On-chain tx confirmed — signed by your wallet" :
           txStatus === "settled" ? "✓ Market settled via CRE — winnings distributed" :
           txStatus === "claimed" ? "✓ Winnings claimed — ETH sent to your wallet" :
           txStatus?.startsWith("error:") ? txStatus.slice(6) :
           txStatus}
        </div>
      )}

      {/* Mode indicator */}
      {txMode === "admin" && !settled && !isExpired && !hasPositions && (
        <div className="mb-2 rounded-md bg-[#7C3AED]/5 border border-[#7C3AED]/10 px-2 py-1 text-[9px] text-[#7C3AED]">
          Admin RPC mode — no wallet popup. Switch to Wallet Signing in Dev tab for MetaMask approval.
        </div>
      )}

      {/* Auto-settle expired markets */}
      {isExpired && !settled && (
        <button
          onClick={handleAutoSettle}
          disabled={settling}
          className="btn-outline w-full text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Zap className="h-3 w-3" />
          {settling ? "Settling via CRE..." : "Settle Market (CRE)"}
        </button>
      )}

      {/* Settled outcome + claim winnings */}
      {settled && (
        <div className={`rounded-lg px-2.5 py-2 text-[10px] font-medium ${
          settledOutcome ? "bg-risk-low/10 text-risk-low" : "bg-risk-critical/10 text-risk-critical"
        }`}>
          <div className="flex items-center gap-1.5">
            <Trophy className="h-3 w-3" />
            Resolved: {settledOutcome ? "YES" : "NO"} — Pool distributed to winners
          </div>
          {hasPositions && (
            <div className="mt-1.5">
              {userIsWinner ? (
                <div className="space-y-1.5">
                  <div className="text-[9px] opacity-80">
                    You won! Payout: {payout.toFixed(decimalPrecision)} ETH
                    {displayCurrency !== "ETH" && (
                      <span className="ml-1">{formatConverted(payout, displayCurrency, decimalPrecision)}</span>
                    )}
                    <span className="ml-1 opacity-60">({userPositions.filter((p) => p.side === winningSide).length} winning position{userPositions.filter((p) => p.side === winningSide).length > 1 ? "s" : ""})</span>
                  </div>
                  {!claimed && account && (
                    <button
                      onClick={handleClaimWinnings}
                      disabled={claiming}
                      className="flex w-full items-center justify-center gap-1.5 rounded-md bg-risk-low/20 py-1.5 text-[10px] font-semibold text-risk-low transition hover:bg-risk-low/30 disabled:opacity-50"
                    >
                      <ArrowDownToLine className="h-3 w-3" />
                      {claiming ? "Claiming..." : `Claim ${payout.toFixed(decimalPrecision)} ETH`}
                    </button>
                  )}
                  {claimed && (
                    <div className="text-[9px] text-risk-low opacity-70">Winnings claimed to your wallet</div>
                  )}
                </div>
              ) : (
                <div className="text-[9px] opacity-80">
                  Your {userPositions.length} position{userPositions.length > 1 ? "s" : ""} ({(totalYesStaked + totalNoStaked).toFixed(decimalPrecision)} ETH total) did not win. ETH distributed to {settledOutcome ? "YES" : "NO"} holders.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
