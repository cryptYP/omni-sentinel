import { NextResponse } from "next/server";

const PROTOCOL_SEARCHES = [
  { slug: "aave", search: "aave v3" },
  { slug: "lido", search: "lido" },
  { slug: "compound", search: "compound v3" },
  { slug: "maker", search: "sky lending" },
  { slug: "uniswap", search: "uniswap v3" },
];

const DEFILLAMA_API = "https://defillama-datasets.llama.fi/lite/v2/protocols";

export const revalidate = 300;

export async function GET() {
  try {
    const res = await fetch(DEFILLAMA_API, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`DeFi Llama returned ${res.status}`);

    const allProtocols = await res.json();

    const results = PROTOCOL_SEARCHES.map(({ slug, search }) => {
      const found = allProtocols.find(
        (p: any) => p.name?.toLowerCase() === search
      ) ?? allProtocols.find(
        (p: any) => p.name?.toLowerCase().includes(slug)
      );
      if (!found) return null;

      const tvl = found.tvl ?? 0;

      // Deterministic risk score based on TVL
      let riskScore: number;
      if (tvl > 10e9) riskScore = 18;
      else if (tvl > 5e9) riskScore = 32;
      else if (tvl > 1e9) riskScore = 48;
      else if (tvl > 100e6) riskScore = 65;
      else riskScore = 82;

      return {
        id: found.id,
        slug,
        name: found.name,
        symbol: found.symbol ?? "",
        category: found.category ?? "DeFi",
        tvl,
        tvlFormatted: formatTvl(tvl),
        chains: found.chainTvls ? Object.keys(found.chainTvls) : [],
        chainTvls: found.chainTvls ?? {},
        riskScore,
        riskLevel: riskScore > 75 ? "CRITICAL" : riskScore > 50 ? "HIGH" : riskScore > 30 ? "MEDIUM" : "LOW",
        mcap: found.mcap ?? null,
      };
    }).filter(Boolean);

    return NextResponse.json({
      protocols: results,
      timestamp: Math.floor(Date.now() / 1000),
      source: "DeFi Llama",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, protocols: [] },
      { status: 500 }
    );
  }
}

function formatTvl(tvl: number): string {
  if (tvl >= 1e9) return `$${(tvl / 1e9).toFixed(2)}B`;
  if (tvl >= 1e6) return `$${(tvl / 1e6).toFixed(2)}M`;
  return `$${tvl.toFixed(0)}`;
}
