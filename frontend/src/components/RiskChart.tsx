/**
 * Risk Intelligence Chart
 *
 * Multi-protocol risk score visualization with four chart styles
 * (Area, Line, Bar, Candlestick). Shows protocol stats (TVL, 24h/7d changes),
 * risk scale indicator with animated ball, and configurable grid/tooltip/height.
 * Data sourced from DeFi Llama via /api/defi/[protocol] route.
 *
 * Sponsors: DeFi Llama (protocol data), Recharts (visualization)
 */
"use client";

import { useProtocolDetail } from "@/lib/hooks";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// Custom candlestick shape for recharts Bar
function CandlestickShape(props: any) {
  const { x, y, width, height, payload } = props;
  if (!payload) return null;
  const { open, close, high, low, isUp } = payload;
  const yScale = (val: number) => y + height - (val / 100) * height;
  const color = isUp ? "var(--risk-low, #40c057)" : "var(--risk-crit, #fa5252)";
  const bodyTop = yScale(Math.max(open, close));
  const bodyBottom = yScale(Math.min(open, close));
  const bodyH = Math.max(bodyBottom - bodyTop, 1);
  const wickX = x + width / 2;
  return (
    <g>
      <line x1={wickX} y1={yScale(high)} x2={wickX} y2={yScale(low)} stroke={color} strokeWidth={1} />
      <rect x={x + width * 0.15} y={bodyTop} width={width * 0.7} height={bodyH} fill={color} rx={1} />
    </g>
  );
}

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
  chartStyle = "Area",
  chartHeight = "Medium",
  animation = true,
  gridLines = true,
  showTooltips = true,
}: {
  activeProtocol: string;
  onProtocolChange: (id: string) => void;
  chartStyle?: string;
  chartHeight?: string;
  animation?: boolean;
  gridLines?: boolean;
  showTooltips?: boolean;
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

  // Generate OHLC-style candlestick data from risk scores
  const candleData = chartData.length > 1
    ? chartData.map((d, i) => {
        const prev = i > 0 ? chartData[i - 1].score : d.score;
        const open = prev;
        const close = d.score;
        const high = Math.min(100, Math.max(open, close) + Math.abs(close - open) * 0.3 + 2);
        const low = Math.max(0, Math.min(open, close) - Math.abs(close - open) * 0.3 - 2);
        return { ...d, open, close, high, low, isUp: close >= open };
      })
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
      <div style={{ height: chartHeight === "Short" ? "10rem" : chartHeight === "Tall" ? "22rem" : "16rem" }}>
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-sentinel-500 border-t-transparent" />
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {chartStyle === "Bar" ? (
              <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                {gridLines && <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 15%)" strokeOpacity={0.5} />}
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(215, 20%, 45%)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(215, 20%, 45%)" }} axisLine={false} tickLine={false} ticks={[0, 25, 50, 75, 100]} />
                {showTooltips && <Tooltip contentStyle={{ background: "hsl(222, 47%, 7%)", border: "1px solid hsl(222, 30%, 15%)", borderRadius: "8px", fontSize: "11px", padding: "8px 12px" }} labelStyle={{ color: "hsl(215, 20%, 65%)", marginBottom: "4px" }} formatter={(value: any) => [`Risk Score: ${Number(value).toFixed(1)}`, ""]} />}
                <ReferenceLine y={70} stroke="#fa5252" strokeDasharray="4 4" strokeOpacity={0.5} />
                <Bar dataKey="score" fill={strokeColor} radius={[2, 2, 0, 0]} animationDuration={animation ? 600 : 0} />
              </BarChart>
            ) : chartStyle === "Candle" ? (
              <BarChart data={candleData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                {gridLines && <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 15%)" strokeOpacity={0.5} />}
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(215, 20%, 45%)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(215, 20%, 45%)" }} axisLine={false} tickLine={false} ticks={[0, 25, 50, 75, 100]} />
                {showTooltips && <Tooltip contentStyle={{ background: "hsl(222, 47%, 7%)", border: "1px solid hsl(222, 30%, 15%)", borderRadius: "8px", fontSize: "11px", padding: "8px 12px" }} labelStyle={{ color: "hsl(215, 20%, 65%)", marginBottom: "4px" }} formatter={(_: any, __: any, item: any) => { const p = item?.payload; if (!p) return [""]; return [`O:${p.open?.toFixed(1)} H:${p.high?.toFixed(1)} L:${p.low?.toFixed(1)} C:${p.close?.toFixed(1)}`, ""]; }} />}
                <ReferenceLine y={70} stroke="#fa5252" strokeDasharray="4 4" strokeOpacity={0.5} />
                <Bar dataKey="score" shape={<CandlestickShape />} animationDuration={animation ? 600 : 0} />
              </BarChart>
            ) : chartStyle === "Line" ? (
              <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                {gridLines && <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 15%)" strokeOpacity={0.5} />}
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(215, 20%, 45%)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(215, 20%, 45%)" }} axisLine={false} tickLine={false} ticks={[0, 25, 50, 75, 100]} />
                {showTooltips && <Tooltip contentStyle={{ background: "hsl(222, 47%, 7%)", border: "1px solid hsl(222, 30%, 15%)", borderRadius: "8px", fontSize: "11px", padding: "8px 12px" }} labelStyle={{ color: "hsl(215, 20%, 65%)", marginBottom: "4px" }} formatter={(value: any) => [`Risk Score: ${Number(value).toFixed(1)}`, ""]} />}
                <ReferenceLine y={70} stroke="#fa5252" strokeDasharray="4 4" strokeOpacity={0.5} />
                <Line type="monotone" dataKey="score" stroke={strokeColor} strokeWidth={2} dot={false} animationDuration={animation ? 600 : 0} />
              </LineChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id={`gradient-${activeProtocol}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                {gridLines && <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 15%)" strokeOpacity={0.5} />}
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(215, 20%, 45%)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(215, 20%, 45%)" }} axisLine={false} tickLine={false} ticks={[0, 25, 50, 75, 100]} />
                {showTooltips && <Tooltip contentStyle={{ background: "hsl(222, 47%, 7%)", border: "1px solid hsl(222, 30%, 15%)", borderRadius: "8px", fontSize: "11px", padding: "8px 12px" }} labelStyle={{ color: "hsl(215, 20%, 65%)", marginBottom: "4px" }} formatter={(value: any) => [`Risk Score: ${Number(value).toFixed(1)}`, ""]} />}
                <ReferenceLine y={70} stroke="#fa5252" strokeDasharray="4 4" strokeOpacity={0.5} />
                <Area type="monotone" dataKey="score" stroke={strokeColor} strokeWidth={2} fill={`url(#gradient-${activeProtocol})`} dot={false} animationDuration={animation ? 600 : 0} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[hsl(var(--muted))]">
            No data available
          </div>
        )}
      </div>

      {/* Risk scale bar */}
      <div className="group/risk flex items-center gap-3">
        <div className="flex-1">
          <div className="relative h-1.5 w-full rounded-full bg-[hsl(var(--card-border))]">
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div className="absolute inset-0 rounded-full" style={{
                background: "linear-gradient(90deg, #40c057 0%, #fab005 40%, #fd7e14 65%, #fa5252 100%)",
              }} />
            </div>
            {data && (() => {
              const ballColor = data.riskScore > 75 ? "#fa5252" : data.riskScore > 50 ? "#fd7e14" : data.riskScore > 30 ? "#fab005" : "#40c057";
              return (
                <div
                  className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-700"
                  style={{ left: `${data.riskScore}%` }}
                >
                  {/* Score label above the ball */}
                  <div
                    className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white whitespace-nowrap opacity-0 group-hover/risk:opacity-100 transition-opacity"
                    style={{ backgroundColor: ballColor }}
                  >
                    {data.riskScore}
                  </div>
                  {/* Pulsing ring */}
                  <div
                    className="absolute h-7 w-7 animate-ping rounded-full"
                    style={{ backgroundColor: ballColor, opacity: 0.3 }}
                  />
                  {/* Indicator ball */}
                  <div
                    className="relative h-5 w-5 rounded-full border-[3px] border-white shadow-lg shadow-black/30"
                    style={{ backgroundColor: ballColor }}
                  />
                </div>
              );
            })()}
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
