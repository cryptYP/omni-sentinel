"use client";

import { useState } from "react";
import { useReadContract, useSendTransaction, useActiveAccount } from "thirdweb/react";
import { prepareContractCall } from "thirdweb";
import { parseEther } from "viem";
import { getPredictionMarket } from "@/lib/contracts";
import { formatEth, formatTimestamp } from "@/lib/utils";
import { TrendingUp, CheckCircle, XCircle, Clock } from "lucide-react";

export function PredictionMarkets() {
  const account = useActiveAccount();
  const market = getPredictionMarket();
  const { mutate: sendTx, isPending } = useSendTransaction();

  const [selectedMarket, setSelectedMarket] = useState<number>(0);
  const [stakeAmount, setStakeAmount] = useState("0.01");
  const [newQuestion, setNewQuestion] = useState("");
  const [newDeadline, setNewDeadline] = useState("");

  const { data: nextMarketId } = useReadContract({
    contract: market,
    method: "nextMarketId",
  });

  const { data: marketData, refetch: refetchMarket } = useReadContract({
    contract: market,
    method: "getMarket",
    params: [BigInt(selectedMarket)],
  });

  const { data: isVerified } = useReadContract({
    contract: market,
    method: "worldIdVerified",
    params: [account?.address as `0x${string}`],
  });

  const totalMarkets = nextMarketId ? Number(nextMarketId) : 0;

  function handleCreateMarket() {
    if (!newQuestion || !newDeadline) return;
    const deadlineUnix = BigInt(Math.floor(new Date(newDeadline).getTime() / 1000));
    const tx = prepareContractCall({
      contract: market,
      method: "createMarket",
      params: [newQuestion, deadlineUnix],
    });
    sendTx(tx, {
      onSuccess: () => {
        setNewQuestion("");
        setNewDeadline("");
      },
    });
  }

  function handleTakePosition(isYes: boolean) {
    const tx = prepareContractCall({
      contract: market,
      method: "takePosition",
      params: [BigInt(selectedMarket), isYes],
      value: parseEther(stakeAmount),
    });
    sendTx(tx, { onSuccess: () => refetchMarket() });
  }

  function handleRequestSettlement() {
    const tx = prepareContractCall({
      contract: market,
      method: "requestSettlement",
      params: [BigInt(selectedMarket)],
    });
    sendTx(tx);
  }

  function handleClaimWinnings() {
    const tx = prepareContractCall({
      contract: market,
      method: "claimWinnings",
      params: [BigInt(selectedMarket)],
    });
    sendTx(tx);
  }

  return (
    <div className="card">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <TrendingUp className="h-5 w-5 text-sentinel-400" />
          Prediction Markets
        </h2>
        <div className="flex items-center gap-2">
          {isVerified ? (
            <span className="risk-badge bg-risk-low/10 text-risk-low">
              <CheckCircle className="mr-1 h-3 w-3" /> World ID Verified
            </span>
          ) : (
            <span className="risk-badge bg-risk-critical/10 text-risk-critical">
              <XCircle className="mr-1 h-3 w-3" /> Not Verified
            </span>
          )}
          <span className="text-xs text-[hsl(var(--muted))]">
            {totalMarkets} markets
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Create Market */}
        <div className="space-y-4 rounded-lg border border-[hsl(var(--card-border))] p-4">
          <h3 className="font-semibold text-sm">Create New Market</h3>
          <input
            type="text"
            placeholder="Will Aave maintain >110% collateral ratio this week?"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            className="w-full rounded-lg border border-[hsl(var(--card-border))] bg-transparent px-3 py-2 text-sm outline-none focus:border-sentinel-500"
          />
          <input
            type="datetime-local"
            value={newDeadline}
            onChange={(e) => setNewDeadline(e.target.value)}
            className="w-full rounded-lg border border-[hsl(var(--card-border))] bg-transparent px-3 py-2 text-sm outline-none focus:border-sentinel-500"
          />
          <button
            onClick={handleCreateMarket}
            disabled={isPending || !newQuestion || !newDeadline}
            className="btn-primary w-full text-sm"
          >
            {isPending ? "Creating..." : "Create Market"}
          </button>
        </div>

        {/* Market Viewer */}
        <div className="space-y-4 rounded-lg border border-[hsl(var(--card-border))] p-4">
          <h3 className="font-semibold text-sm">View Market</h3>

          {/* Market selector */}
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              max={Math.max(0, totalMarkets - 1)}
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(Number(e.target.value))}
              className="w-20 rounded-lg border border-[hsl(var(--card-border))] bg-transparent px-3 py-2 text-sm outline-none"
            />
            <span className="flex items-center text-xs text-[hsl(var(--muted))]">
              Market ID
            </span>
          </div>

          {marketData && (
            <>
              <div className="rounded-lg bg-[hsl(var(--background))] p-3">
                <p className="text-sm font-medium">{marketData.question || "No question"}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-[hsl(var(--muted))]">
                  <Clock className="h-3 w-3" />
                  Deadline: {marketData.deadline ? formatTimestamp(Number(marketData.deadline)) : "N/A"}
                </div>
              </div>

              {/* Stakes */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-risk-low/5 p-3 text-center">
                  <p className="text-xs text-[hsl(var(--muted))]">YES Pool</p>
                  <p className="font-mono text-sm font-semibold text-risk-low">
                    {formatEth(marketData.totalYesStake ?? 0n)} ETH
                  </p>
                </div>
                <div className="rounded-lg bg-risk-critical/5 p-3 text-center">
                  <p className="text-xs text-[hsl(var(--muted))]">NO Pool</p>
                  <p className="font-mono text-sm font-semibold text-risk-critical">
                    {formatEth(marketData.totalNoStake ?? 0n)} ETH
                  </p>
                </div>
              </div>

              {/* Actions */}
              {!marketData.resolved ? (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="ETH amount"
                      className="w-24 rounded-lg border border-[hsl(var(--card-border))] bg-transparent px-3 py-2 text-sm outline-none"
                    />
                    <button
                      onClick={() => handleTakePosition(true)}
                      disabled={isPending || !isVerified}
                      className="flex-1 rounded-lg bg-risk-low/20 px-3 py-2 text-sm font-medium text-risk-low transition hover:bg-risk-low/30 disabled:opacity-50"
                    >
                      Bet YES
                    </button>
                    <button
                      onClick={() => handleTakePosition(false)}
                      disabled={isPending || !isVerified}
                      className="flex-1 rounded-lg bg-risk-critical/20 px-3 py-2 text-sm font-medium text-risk-critical transition hover:bg-risk-critical/30 disabled:opacity-50"
                    >
                      Bet NO
                    </button>
                  </div>
                  <button
                    onClick={handleRequestSettlement}
                    disabled={isPending}
                    className="btn-outline w-full text-sm"
                  >
                    Request Settlement (triggers CRE workflow)
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="rounded-lg bg-sentinel-600/10 p-3 text-center">
                    <p className="text-xs text-[hsl(var(--muted))]">Outcome</p>
                    <p className="text-lg font-bold text-sentinel-400">
                      {marketData.outcome ? "YES" : "NO"}
                    </p>
                    <p className="text-xs text-[hsl(var(--muted))]">
                      Confidence: {Number(marketData.confidence) / 100}%
                    </p>
                  </div>
                  <button
                    onClick={handleClaimWinnings}
                    disabled={isPending}
                    className="btn-primary w-full text-sm"
                  >
                    Claim Winnings
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
