"use client";

import { useProtocolDetail } from "@/lib/hooks";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const PROTOCOLS = [
  { id: "aave", label: "Aave", color: "#B6509E" },
  { id: "compound", label: "Compound", color: "#00D395" },
  { id: "lido", label: "Lido", color: "#00A3FF" },
  { id: "maker", label: "Sky/Maker", color: "#1AAB9B" },
  { id: "uniswap", label: "Uniswap", color: "#FF007A" },
];

export function RiskChart({
  activeProtocol,
  onProtocolChange,
}: {
  activeProtocol: string;
  onProtocolChange: (id: string) => void;
}) {
  const { data, loading } = useProtocolDetail(activeProtocol);

  const protocolInfo = PROTOCOLS.find((p) => p.id === activeProtocol);
  const strokeColor = protocolInfo?.color ?? "#5c7cfa";

  const chartData = data
    ? data.riskHistory.map((entry) => ({
        date: new Date(entry.date * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        score: entry.score,
        tvl: entry.tvl,
      }))
    : [];

  return (
    <div className="space-y-4">
      {/* Protocol selector tabs */}
      <div className="flex items-center gap-1 rounded-lg bg-[hsl(var(--background))] p-1 overflow-x-auto">
        {PROTOCOLS.map((p) => (
          <button
            key={p.id}
            onClick={() => onProtocolChange(p.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              activeProtocol === p.id
                ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm"
                : "text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
            }`}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            {p.label}
          </button>
        ))}
      </div>

      {/* Protocol stats row */}
      {data && !loading && (
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-lg bg-[hsl(var(--background))] p-2.5 text-center">
            <p className="text-[9px] text-[hsl(var(--muted))]">TVL</p>
            <p className="text-sm font-bold">{data.tvlFormatted}</p>
          </div>
          <div className="rounded-lg bg-[hsl(var(--background))] p-2.5 text-center">
            <p className="text-[9px] text-[hsl(var(--muted))]">24h</p>
            <p className={`flex items-center justify-center gap-0.5 text-sm font-bold ${data.change1d >= 0 ? "text-risk-low" : "text-risk-critical"}`}>
              {data.change1d >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {data.change1d >= 0 ? "+" : ""}{data.change1d}%
            </p>
          </div>
          <div className="rounded-lg bg-[hsl(var(--background))] p-2.5 text-center">
            <p className="text-[9px] text-[hsl(var(--muted))]">7d</p>
            <p className={`flex items-center justify-center gap-0.5 text-sm font-bold ${data.change7d >= 0 ? "text-risk-low" : "text-risk-critical"}`}>
              {data.change7d >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {data.change7d >= 0 ? "+" : ""}{data.change7d}%
            </p>
          </div>
          <div className="rounded-lg bg-[hsl(var(--background))] p-2.5 text-center">
            <p className="text-[9px] text-[hsl(var(--muted))]">Chains</p>
            <p className="text-sm font-bold">{data.chains.length}</p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-52">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-sentinel-500 border-t-transparent" />
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id={`gradient-${activeProtocol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: "hsl(215, 20%, 45%)" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 9, fill: "hsl(215, 20%, 45%)" }}
                axisLine={false}
                tickLine={false}
                ticks={[0, 25, 50, 75, 100]}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(222, 47%, 7%)",
                  border: "1px solid hsl(222, 30%, 15%)",
                  borderRadius: "8px",
                  fontSize: "11px",
                  padding: "8px 12px",
                }}
                labelStyle={{ color: "hsl(215, 20%, 65%)", marginBottom: "4px" }}
                formatter={(value: any) => [`Risk Score: ${value}`, ""]}
              />
              <ReferenceLine
                y={70}
                stroke="#fa5252"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke={strokeColor}
                strokeWidth={2}
                fill={`url(#gradient-${activeProtocol})`}
                dot={false}
                animationDuration={600}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[hsl(var(--muted))]">
            No data available
          </div>
        )}
      </div>

      {/* Risk scale bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--card-border))]">
            <div className="absolute inset-0 rounded-full" style={{
              background: "linear-gradient(90deg, #40c057 0%, #fab005 40%, #fd7e14 65%, #fa5252 100%)",
            }} />
            {data && (
              <div
                className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white shadow-lg transition-all duration-700"
                style={{
                  left: `${data.riskScore}%`,
                  backgroundColor: data.riskScore > 75 ? "#fa5252" : data.riskScore > 50 ? "#fd7e14" : data.riskScore > 30 ? "#fab005" : "#40c057",
                }}
              />
            )}
          </div>
          <div className="mt-1.5 flex justify-between text-[8px] text-[hsl(var(--muted))]">
            <span>Low Risk</span>
            <span>Medium</span>
            <span>High</span>
            <span>Critical</span>
          </div>
        </div>
      </div>
    </div>
  );
}
