import { NextResponse } from "next/server";

export const revalidate = 300;

// Map friendly names to DeFi Llama slugs
const SLUG_MAP: Record<string, string> = {
  aave: "aave-v3",
  compound: "compound-v3",
  lido: "lido",
  maker: "sky-lending",
  uniswap: "uniswap-v3",
};

export async function GET(
  _req: Request,
  { params }: { params: { protocol: string } }
) {
  const slug = SLUG_MAP[params.protocol] ?? params.protocol;

  try {
    const res = await fetch(`https://api.llama.fi/protocol/${slug}`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) throw new Error(`DeFi Llama returned ${res.status}`);
    const data = await res.json();

    // Extract last 30 days of TVL history
    const tvlHistory: Array<{ date: number; tvl: number }> = (data.tvl ?? [])
      .slice(-30)
      .map((entry: any) => ({
        date: entry.date,
        tvl: entry.totalLiquidityUSD,
      }));

    // Calculate changes
    const currentTvl = tvlHistory.length > 0 ? tvlHistory[tvlHistory.length - 1].tvl : 0;
    const dayAgoTvl = tvlHistory.length > 1 ? tvlHistory[tvlHistory.length - 2].tvl : currentTvl;
    const weekAgoTvl = tvlHistory.length > 7 ? tvlHistory[tvlHistory.length - 8].tvl : currentTvl;

    const change1d = dayAgoTvl > 0 ? ((currentTvl - dayAgoTvl) / dayAgoTvl) * 100 : 0;
    const change7d = weekAgoTvl > 0 ? ((currentTvl - weekAgoTvl) / weekAgoTvl) * 100 : 0;

    // Derive risk score
    let riskScore: number;
    if (currentTvl > 10e9) riskScore = 18;
    else if (currentTvl > 5e9) riskScore = 32;
    else if (currentTvl > 1e9) riskScore = 48;
    else if (currentTvl > 100e6) riskScore = 65;
    else riskScore = 82;

    // Adjust for volatility
    if (Math.abs(change1d) > 5) riskScore += 10;
    if (Math.abs(change7d) > 15) riskScore += 15;
    riskScore = Math.min(100, riskScore);

    // Build risk history from TVL history
    const riskHistory = tvlHistory.map((entry) => {
      let score: number;
      if (entry.tvl > 10e9) score = 18;
      else if (entry.tvl > 5e9) score = 32;
      else if (entry.tvl > 1e9) score = 48;
      else score = 65;
      return {
        date: entry.date,
        score,
        tvl: entry.tvl,
      };
    });

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
      riskLevel: riskScore > 75 ? "CRITICAL" : riskScore > 50 ? "HIGH" : riskScore > 30 ? "MEDIUM" : "LOW",
      riskHistory,
      tvlHistory,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function formatTvl(tvl: number): string {
  if (tvl >= 1e9) return `$${(tvl / 1e9).toFixed(2)}B`;
  if (tvl >= 1e6) return `$${(tvl / 1e6).toFixed(2)}M`;
  return `$${tvl.toFixed(0)}`;
}
