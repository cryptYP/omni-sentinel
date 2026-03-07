"use client";

import { useReadContract } from "thirdweb/react";
import { getRiskOracle } from "@/lib/contracts";
import { formatRiskScore, formatTimestamp } from "@/lib/utils";
import { Activity, Clock, BarChart3 } from "lucide-react";

export function RiskDashboard() {
  const riskOracle = getRiskOracle();

  const { data: latestScore, isLoading } = useReadContract({
    contract: riskOracle,
    method: "getLatestRiskScore",
  });

  const { data: updateCount } = useReadContract({
    contract: riskOracle,
    method: "updateCount",
  });

  const score = latestScore ? Number(latestScore[0]) : 0;
  const timestamp = latestScore ? Number(latestScore[1]) : 0;
  const risk = formatRiskScore(score);

  return (
    <div className="card">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-sentinel-400" />
          Risk Dashboard
        </h2>
        <span className="text-xs text-[hsl(var(--muted))]">
          Powered by Chainlink CRE + Gemini AI
        </span>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-[hsl(var(--muted))]">
          Loading risk data from RiskOracle...
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-3">
          {/* Risk Score Gauge */}
          <div className="flex flex-col items-center justify-center rounded-lg border border-[hsl(var(--card-border))] p-6">
            <div className="relative mb-3">
              <svg className="h-32 w-32" viewBox="0 0 100 100">
                {/* Background arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="hsl(222, 30%, 15%)"
                  strokeWidth="8"
                  strokeDasharray="198 66"
                  strokeDashoffset="-33"
                  strokeLinecap="round"
                />
                {/* Score arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={
                    score > 90
                      ? "#fa5252"
                      : score > 75
                        ? "#fd7e14"
                        : score > 50
                          ? "#fab005"
                          : "#40c057"
                  }
                  strokeWidth="8"
                  strokeDasharray={`${(score / 100) * 198} ${264 - (score / 100) * 198}`}
                  strokeDashoffset="-33"
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{score}</span>
                <span className="text-xs text-[hsl(var(--muted))]">/100</span>
              </div>
            </div>
            <span className={`risk-badge ${risk.bgColor} ${risk.color}`}>
              {risk.label}
            </span>
          </div>

          {/* Details */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-[hsl(var(--card-border))] p-4">
              <Activity className="h-5 w-5 text-sentinel-400" />
              <div>
                <p className="text-xs text-[hsl(var(--muted))]">
                  Risk Score
                </p>
                <p className={`text-2xl font-bold ${risk.color}`}>{score}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-[hsl(var(--card-border))] p-4">
              <Clock className="h-5 w-5 text-sentinel-400" />
              <div>
                <p className="text-xs text-[hsl(var(--muted))]">
                  Last Updated
                </p>
                <p className="font-mono text-sm">
                  {timestamp > 0 ? formatTimestamp(timestamp) : "No data yet"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-[hsl(var(--card-border))] p-4">
              <BarChart3 className="h-5 w-5 text-sentinel-400" />
              <div>
                <p className="text-xs text-[hsl(var(--muted))]">
                  Total Updates
                </p>
                <p className="text-lg font-semibold">
                  {updateCount ? Number(updateCount).toString() : "0"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
