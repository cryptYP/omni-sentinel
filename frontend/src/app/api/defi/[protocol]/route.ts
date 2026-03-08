/**
 * Protocol Detail API — /api/defi/[protocol]
 *
 * Fetches 90-day TVL history for a specific protocol from DeFi Llama.
 * Computes dynamic risk scores using base TVL tier + day-over-day volatility
 * + 7-day rolling standard deviation. Revalidates every 120s.
 *
 * Sponsors: DeFi Llama (api.llama.fi/protocol/{slug})
 */
import { NextResponse } from "next/server";

export const revalidate = 120;

// Map friendly names to DeFi Llama slugs
const SLUG_MAP: Record<string, string> = {
  aave: "aave-v3",
  compound: "compound-v3",
  lido: "lido",
  maker: "sky-lending",
  uniswap: "uniswap-v3",
};

/** TVL-based base risk score */
function baseRiskFromTvl(tvl: number): number {
  if (tvl > 10e9) return 18;
  if (tvl > 5e9) return 32;
  if (tvl > 1e9) return 48;
  if (tvl > 100e6) return 65;
  return 82;
}

/** Standard deviation of an array of numbers */
function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sqDiffs = values.map((v) => (v - mean) ** 2);
  return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / values.length);
}

/** Clamp a number between min and max */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export async function GET(
  _req: Request,
  { params }: { params: { protocol: string } }
) {
  const slug = SLUG_MAP[params.protocol] ?? params.protocol;

  try {
    const res = await fetch(`https://api.llama.fi/protocol/${slug}`, {
      next: { revalidate: 120 },
    });

    if (!res.ok) throw new Error(`DeFi Llama returned ${res.status}`);
    const data = await res.json();

    // Extract last 90 days of TVL history for richer risk analysis
    const tvlHistory: Array<{ date: number; tvl: number }> = (data.tvl ?? [])
      .slice(-90)
      .map((entry: any) => ({
        date: entry.date,
        tvl: entry.totalLiquidityUSD,
      }));

    // Calculate changes from actual latest data points
    const currentTvl =
      tvlHistory.length > 0 ? tvlHistory[tvlHistory.length - 1].tvl : 0;
    const dayAgoTvl =
      tvlHistory.length > 1
        ? tvlHistory[tvlHistory.length - 2].tvl
        : currentTvl;
    const weekAgoTvl =
      tvlHistory.length > 7
        ? tvlHistory[tvlHistory.length - 8].tvl
        : currentTvl;

    const change1d =
      dayAgoTvl > 0 ? ((currentTvl - dayAgoTvl) / dayAgoTvl) * 100 : 0;
    const change7d =
      weekAgoTvl > 0 ? ((currentTvl - weekAgoTvl) / weekAgoTvl) * 100 : 0;

    // Derive current risk score using dynamic method (same as history, for consistency)
    const riskScore = clamp(
      computeDynamicRisk(tvlHistory, tvlHistory.length - 1),
      5,
      95
    );

    // Build dynamic risk history
    const riskHistory = tvlHistory.map((entry, i) => ({
      date: entry.date,
      score: clamp(computeDynamicRisk(tvlHistory, i), 5, 95),
      tvl: entry.tvl,
    }));

    return NextResponse.json({
      name: data.name,
      symbol: data.symbol,
      category: data.category,
      chains: data.chains ?? [],
      currentTvl,
      tvlFormatted: formatTvl(currentTvl),
      change1d: +change1d.toFixed(2),
      change7d: +change7d.toFixed(2),
      riskScore,
      riskLevel:
        riskScore > 75
          ? "CRITICAL"
          : riskScore > 50
            ? "HIGH"
            : riskScore > 30
              ? "MEDIUM"
              : "LOW",
      riskHistory,
      tvlHistory,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Compute a dynamic risk score for a given index in the TVL history.
 *
 * Components:
 * 1. Base score from TVL bucket
 * 2. Day-over-day TVL change volatility adjustment
 * 3. 7-day rolling standard deviation of daily % changes
 */
function computeDynamicRisk(
  history: Array<{ date: number; tvl: number }>,
  index: number
): number {
  const entry = history[index];
  let score = baseRiskFromTvl(entry.tvl);

  // Day-over-day % change component
  if (index > 0) {
    const prevTvl = history[index - 1].tvl;
    if (prevTvl > 0) {
      const dailyChange = ((entry.tvl - prevTvl) / prevTvl) * 100;

      if (dailyChange <= -5) {
        score += 20;
      } else if (dailyChange <= -2) {
        // Scale linearly from 8 to 15 for drops between -2% and -5%
        score += Math.round(8 + ((Math.abs(dailyChange) - 2) / 3) * 7);
      } else if (dailyChange >= 3) {
        score -= 5;
      }
    }
  }

  // 7-day rolling volatility component
  const windowStart = Math.max(0, index - 6); // up to 7 data points including current
  const dailyChanges: number[] = [];
  for (let i = windowStart + 1; i <= index; i++) {
    const prev = history[i - 1].tvl;
    if (prev > 0) {
      dailyChanges.push(((history[i].tvl - prev) / prev) * 100);
    }
  }

  if (dailyChanges.length >= 2) {
    const volatility = stddev(dailyChanges);
    // Scale volatility to 0-20 points: 1% stddev = ~5 points, cap at 20
    const volatilityContribution = Math.min(20, volatility * 5);
    score += volatilityContribution;
  }

  return score;
}

function formatTvl(tvl: number): string {
  if (tvl >= 1e9) return `$${(tvl / 1e9).toFixed(2)}B`;
  if (tvl >= 1e6) return `$${(tvl / 1e6).toFixed(2)}M`;
  return `$${tvl.toFixed(0)}`;
}
