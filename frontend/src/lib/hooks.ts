"use client";

import { useState, useEffect } from "react";

export type ProtocolData = {
  id: string;
  slug: string;
  name: string;
  symbol: string;
  category: string;
  tvl: number;
  tvlFormatted: string;
  chains: string[];
  chainTvls: Record<string, number>;
  riskScore: number;
  riskLevel: string;
  mcap: number | null;
};

export type ProtocolDetail = {
  name: string;
  symbol: string;
  category: string;
  chains: string[];
  currentTvl: number;
  tvlFormatted: string;
  change1d: number;
  change7d: number;
  riskScore: number;
  riskLevel: string;
  riskHistory: Array<{ date: number; score: number; tvl: number }>;
  tvlHistory: Array<{ date: number; tvl: number }>;
  timestamp: number;
};

export function useDefiProtocols() {
  const [data, setData] = useState<ProtocolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/defi")
      .then((r) => r.json())
      .then((json) => {
        setData(json.protocols ?? []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { protocols: data, loading, error };
}

export function useProtocolDetail(protocol: string) {
  const [data, setData] = useState<ProtocolDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/defi/${protocol}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.error) setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [protocol]);

  return { data, loading };
}

// Pre-built prediction markets (demo data that works without blockchain)
// Use fixed deadlines to avoid server/client hydration mismatch
export function getDemoMarkets() {
  const now = Math.floor(Date.now() / 1000);
  return [
    {
      id: 0,
      question: "Will Aave maintain TVL above $30B through March 2026?",
      deadline: now + 7 * 86400,
      yesPool: 2.45,
      noPool: 0.82,
      resolved: false,
      category: "TVL",
      protocol: "Aave",
    },
    {
      id: 1,
      question: "Will Lido's staking ratio stay above 28% of ETH supply?",
      deadline: now + 14 * 86400,
      yesPool: 1.2,
      noPool: 1.8,
      resolved: false,
      category: "Staking",
      protocol: "Lido",
    },
    {
      id: 2,
      question: "Will Compound avoid any liquidation events > $10M this week?",
      deadline: now + 5 * 86400,
      yesPool: 3.1,
      noPool: 0.45,
      resolved: false,
      category: "Safety",
      protocol: "Compound",
    },
    {
      id: 3,
      question: "Will Sky (Maker) DAI maintain its $1 peg within 0.5%?",
      deadline: now + 3 * 86400,
      yesPool: 5.0,
      noPool: 0.3,
      resolved: false,
      category: "Stability",
      protocol: "Sky/Maker",
    },
    {
      id: 4,
      question: "Will total DeFi TVL exceed $120B by end of week?",
      deadline: now + 7 * 86400,
      yesPool: 1.5,
      noPool: 2.1,
      resolved: false,
      category: "Market",
      protocol: "DeFi",
    },
  ];
}
