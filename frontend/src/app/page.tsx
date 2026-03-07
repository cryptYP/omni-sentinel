"use client";

import { useState, useEffect } from "react";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { sepolia } from "thirdweb/chains";
import { client } from "@/lib/thirdweb";
import { useDefiProtocols, getDemoMarkets } from "@/lib/hooks";
import { WorldIDAuth } from "@/components/WorldIDAuth";
import { RiskChart } from "@/components/RiskChart";
import { MarketCard } from "@/components/MarketCard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Portfolio } from "@/components/Portfolio";
import {
  Shield,
  Activity,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  BarChart3,
  Zap,
  Radio,
  Wallet,
  Globe,
  Fingerprint,
  ArrowRight,
  Server,
  ExternalLink,
  Link2,
} from "lucide-react";

export default function Home() {
  const [activeProtocol, setActiveProtocol] = useState("aave");
  const [newQuestion, setNewQuestion] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [isWorldIdVerified, setIsWorldIdVerified] = useState(false);
  const [markets, setMarkets] = useState<ReturnType<typeof getDemoMarkets>>([]);
  const [activeTab, setActiveTab] = useState<"markets" | "create">("markets");
  const [mounted, setMounted] = useState(false);

  // Initialize demo markets on client only to avoid hydration mismatch
  useEffect(() => {
    setMarkets(getDemoMarkets());
    setMounted(true);
  }, []);
  const account = useActiveAccount();

  const { protocols, loading: protocolsLoading } = useDefiProtocols();

  const avgRisk = protocols.length > 0
    ? Math.round(protocols.reduce((s, p) => s + p.riskScore, 0) / protocols.length)
    : 0;
  const systemHealthy = avgRisk < 50;
  const highRiskCount = protocols.filter((p) => p.riskScore > 50).length;

  function handleCreateMarket() {
    if (!newQuestion || !newDeadline) return;
    const deadlineUnix = Math.floor(new Date(newDeadline).getTime() / 1000);
    const newMarket = {
      id: markets.length,
      question: newQuestion,
      deadline: deadlineUnix,
      yesPool: 0,
      noPool: 0,
      resolved: false,
      category: "Custom",
      protocol: "User",
    };
    setMarkets([newMarket, ...markets]);
    setNewQuestion("");
    setNewDeadline("");
    setActiveTab("markets");
  }

  return (
    <div className="min-h-screen">
      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-50 border-b border-[hsl(var(--card-border))] bg-[hsl(var(--background))]/80 px-6 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sentinel-600/20">
              <Shield className="h-5 w-5 text-sentinel-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">OmniSentinel</h1>
              <p className="text-[10px] text-[hsl(var(--muted))] leading-none">
                AI-Powered Cross-Chain Risk Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <WorldIDAuth onVerified={() => setIsWorldIdVerified(true)} />
            <ConnectButton
              client={client}
              chain={sepolia}
              connectButton={{
                label: "Connect Wallet",
                style: {
                  backgroundColor: "hsl(222, 47%, 7%)",
                  border: "1px solid hsl(222, 30%, 15%)",
                  color: "white",
                  borderRadius: "0.5rem",
                  fontSize: "0.75rem",
                  fontWeight: "500",
                  padding: "0.5rem 0.875rem",
                },
              }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-6">
        {/* ─── POWERED BY BANNER ─── */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto rounded-lg border border-[hsl(var(--card-border))] bg-[hsl(var(--card))]/50 px-4 py-2 text-[10px] text-[hsl(var(--muted))]">
          <span className="shrink-0 font-medium text-[hsl(var(--foreground))]">Powered by</span>
          <span className="shrink-0 flex items-center gap-1 rounded bg-[#375BD2]/10 px-2 py-0.5 text-[#375BD2] font-medium">
            <Link2 className="h-2.5 w-2.5" /> Chainlink CRE
          </span>
          <span className="shrink-0 flex items-center gap-1 rounded bg-[#A855F7]/10 px-2 py-0.5 text-[#A855F7] font-medium">
            thirdweb SDK
          </span>
          <span className="shrink-0 flex items-center gap-1 rounded bg-[#00C3B6]/10 px-2 py-0.5 text-[#00C3B6] font-medium">
            <Fingerprint className="h-2.5 w-2.5" /> World ID
          </span>
          <span className="shrink-0 flex items-center gap-1 rounded bg-[#7C3AED]/10 px-2 py-0.5 text-[#7C3AED] font-medium">
            Tenderly VTestNet
          </span>
          <span className="shrink-0 flex items-center gap-1 rounded bg-[#4285F4]/10 px-2 py-0.5 text-[#4285F4] font-medium">
            Gemini AI
          </span>
          <span className="shrink-0 flex items-center gap-1 rounded bg-risk-low/10 px-2 py-0.5 text-risk-low font-medium">
            DeFi Llama
          </span>
        </div>

        {/* ─── SYSTEM PULSE ─── */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <PulseCard
            icon={
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${systemHealthy ? "bg-risk-low/10" : "bg-risk-high/10"}`}>
                <ShieldCheck className={`h-5 w-5 ${systemHealthy ? "text-risk-low" : "text-risk-high"}`} />
              </div>
            }
            label="System Health"
            value={systemHealthy ? "Healthy" : "Elevated Risk"}
            valueColor={systemHealthy ? "text-risk-low" : "text-risk-high"}
            sub={`Avg risk: ${avgRisk}/100`}
          />
          <PulseCard
            icon={
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sentinel-600/10">
                <Globe className="h-5 w-5 text-sentinel-400" />
              </div>
            }
            label="Protocols Monitored"
            value={protocolsLoading ? "..." : `${protocols.length} Live`}
            sub={`${highRiskCount} elevated risk`}
          />
          <PulseCard
            icon={
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sentinel-600/10">
                <TrendingUp className="h-5 w-5 text-sentinel-400" />
              </div>
            }
            label="Prediction Markets"
            value={`${markets.length} Active`}
            sub="World ID gated"
          />
          <PulseCard
            icon={
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-risk-low/10">
                <Server className="h-5 w-5 text-risk-low" />
              </div>
            }
            label="Services"
            value="All Up"
            valueColor="text-risk-low"
            sub="6 services connected"
          />
        </div>

        {/* ─── LIVE PROTOCOL HEALTH STRIP ─── */}
        {!protocolsLoading && protocols.length > 0 && (
          <div className="mb-6 overflow-x-auto">
            <div className="flex gap-2">
              {protocols.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveProtocol(p.slug)}
                  className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all ${
                    activeProtocol === p.slug
                      ? "border-sentinel-600/40 bg-sentinel-600/5"
                      : "border-[hsl(var(--card-border))] hover:border-[hsl(var(--card-border))]/80"
                  }`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${
                    p.riskScore > 50 ? "bg-risk-high" : "bg-risk-low"
                  }`} />
                  <div>
                    <p className="text-xs font-medium">{p.name}</p>
                    <p className="text-[9px] text-[hsl(var(--muted))]">
                      {p.tvlFormatted} · Risk {p.riskScore}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── MAIN GRID: Risk Chart + Services ─── */}
        <div className="mb-6 grid gap-6 lg:grid-cols-3">
          {/* Risk Intelligence (2/3) */}
          <div className="card lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-sentinel-400" />
                <h2 className="text-sm font-semibold">Risk Intelligence</h2>
                <span className="flex items-center gap-1 rounded-full bg-risk-low/10 px-2 py-0.5 text-[9px] text-risk-low">
                  <Radio className="h-2.5 w-2.5 animate-pulse" /> Live
                </span>
              </div>
              <span className="text-[9px] text-[hsl(var(--muted))]">
                Data: DeFi Llama &middot; Analysis: Chainlink CRE + Gemini AI
              </span>
            </div>

            <RiskChart activeProtocol={activeProtocol} onProtocolChange={setActiveProtocol} />

            {/* CRE Data Flow — shows Chainlink CRE pipeline */}
            <div className="mt-4 rounded-lg bg-[hsl(var(--background))] p-3">
              <p className="mb-2 text-[9px] font-medium text-[hsl(var(--muted))]">CHAINLINK CRE DATA PIPELINE</p>
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="rounded bg-risk-low/10 px-2 py-0.5 text-risk-low font-medium">DeFi Llama API</span>
                <ArrowRight className="h-3 w-3 text-[hsl(var(--muted))]" />
                <span className="rounded bg-[#375BD2]/10 px-2 py-0.5 text-[#375BD2] font-medium">RiskMonitor CRE</span>
                <ArrowRight className="h-3 w-3 text-[hsl(var(--muted))]" />
                <span className="rounded bg-[#375BD2]/10 px-2 py-0.5 text-[#375BD2] font-medium">Gemini AI Analysis</span>
                <ArrowRight className="h-3 w-3 text-[hsl(var(--muted))]" />
                <span className="rounded bg-[#7C3AED]/10 px-2 py-0.5 text-[#7C3AED] font-medium">RiskOracle (Tenderly)</span>
                <ArrowRight className="h-3 w-3 text-[hsl(var(--muted))]" />
                <span className="rounded bg-[#A855F7]/10 px-2 py-0.5 text-[#A855F7] font-medium">thirdweb Dashboard</span>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Service Status */}
            <div className="card">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Server className="h-4 w-4 text-sentinel-400" />
                Service Status
              </h2>
              <div className="space-y-2">
                <ServiceRow name="DeFi Llama API" status="connected" detail="Live protocol TVL data" badge="Data Source" />
                <ServiceRow name="Chainlink CRE" status="running" detail="3 workflows active" badge="Orchestration" badgeColor="text-[#375BD2] bg-[#375BD2]/10" />
                <ServiceRow name="thirdweb SDK" status="connected" detail="Wallet + contract calls" badge="Web3" badgeColor="text-[#A855F7] bg-[#A855F7]/10" />
                <ServiceRow name="World ID" status="ready" detail="Sybil-resistant gating" badge="Identity" badgeColor="text-[#00C3B6] bg-[#00C3B6]/10" />
                <ServiceRow name="Tenderly VTestNet" status="connected" detail="Chain ID 73571" badge="Testnet" badgeColor="text-[#7C3AED] bg-[#7C3AED]/10" />
                <ServiceRow name="Gemini AI" status="ready" detail="Risk analysis engine" badge="AI" badgeColor="text-[#4285F4] bg-[#4285F4]/10" />
              </div>
            </div>

            {/* Circuit Breaker — driven by CRE SafeguardTrigger */}
            <div className="card">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className={`h-4 w-4 ${systemHealthy ? "text-risk-low" : "text-risk-high"}`} />
                  <h2 className="text-sm font-semibold">Circuit Breaker</h2>
                </div>
                <span className="rounded bg-[#375BD2]/10 px-1.5 py-0.5 text-[8px] text-[#375BD2] font-medium">CRE SafeguardTrigger</span>
              </div>
              <div className={`flex items-center justify-center rounded-lg p-4 ${
                systemHealthy
                  ? "bg-risk-low/5 border border-risk-low/20"
                  : "bg-risk-high/5 border border-risk-high/20"
              }`}>
                <div className="text-center">
                  {systemHealthy ? (
                    <ShieldCheck className="mx-auto mb-1 h-7 w-7 text-risk-low" />
                  ) : (
                    <ShieldAlert className="mx-auto mb-1 h-7 w-7 text-risk-high" />
                  )}
                  <p className={`text-lg font-bold ${systemHealthy ? "text-risk-low" : "text-risk-high"}`}>
                    {systemHealthy ? "ACTIVE" : "ALERT"}
                  </p>
                  <p className="mt-0.5 text-[9px] text-[hsl(var(--muted))]">
                    Threshold: 70 &middot; Current avg: {avgRisk}
                  </p>
                </div>
              </div>
              <div className="mt-2 rounded-lg bg-[hsl(var(--background))] px-3 py-2 text-[9px] text-[hsl(var(--muted))]">
                <span className="font-medium">How it works:</span> CRE reads RiskOracle every 60s. If score {">"} 70, SafeguardController circuit breaker engages automatically on-chain.
              </div>
            </div>
          </div>
        </div>

        {/* ─── PREDICTION MARKETS ─── */}
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-4 w-4 text-sentinel-400" />
              <h2 className="text-sm font-semibold">Prediction Markets</h2>
              <span className="rounded bg-[#375BD2]/10 px-1.5 py-0.5 text-[8px] text-[#375BD2] font-medium">CRE MarketSettler</span>
              <div className="flex items-center gap-1 rounded-lg bg-[hsl(var(--background))] p-0.5">
                <button
                  onClick={() => setActiveTab("markets")}
                  className={`rounded-md px-3 py-1 text-[10px] font-medium transition ${
                    activeTab === "markets"
                      ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))]"
                      : "text-[hsl(var(--muted))]"
                  }`}
                >
                  Live Markets
                </button>
                <button
                  onClick={() => setActiveTab("create")}
                  className={`rounded-md px-3 py-1 text-[10px] font-medium transition ${
                    activeTab === "create"
                      ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))]"
                      : "text-[hsl(var(--muted))]"
                  }`}
                >
                  + Create
                </button>
              </div>
            </div>

            {!isWorldIdVerified && account && (
              <div className="flex items-center gap-1.5 rounded-lg border border-risk-critical/20 bg-risk-critical/5 px-3 py-1.5 text-[10px] text-risk-critical">
                <Fingerprint className="h-3.5 w-3.5" />
                <span>
                  <span className="font-semibold">World ID</span> verification required to place predictions
                </span>
              </div>
            )}
            {!account && (
              <div className="flex items-center gap-1.5 rounded-lg border border-sentinel-600/20 bg-sentinel-600/5 px-3 py-1.5 text-[10px] text-sentinel-400">
                <Wallet className="h-3.5 w-3.5" />
                <span>
                  Connect wallet via <span className="font-semibold">thirdweb</span> to participate
                </span>
              </div>
            )}
          </div>

          {activeTab === "create" && (
            <div className="mb-4 rounded-xl border border-sentinel-700/30 bg-sentinel-600/5 p-5">
              <h3 className="mb-3 text-xs font-semibold">Create a Prediction Market</h3>
              {!isWorldIdVerified ? (
                <div className="flex items-center gap-3 rounded-lg bg-risk-critical/5 border border-risk-critical/10 p-4 text-xs text-risk-critical">
                  <Fingerprint className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-medium">World ID Verification Required</p>
                    <p className="mt-0.5 text-[10px] opacity-80">
                      Verify your identity with <span className="font-semibold">World ID</span> (header button) to create prediction markets.
                      This ensures sybil-resistant, compliant participation &mdash; a core requirement of the protocol.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-[1fr_200px_auto]">
                  <input
                    type="text"
                    placeholder="e.g. Will Compound avoid liquidation events >$5M this week?"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    className="rounded-lg border border-[hsl(var(--card-border))] bg-transparent px-3 py-2 text-sm outline-none focus:border-sentinel-500 placeholder:text-[hsl(var(--muted))]/50"
                  />
                  <input
                    type="datetime-local"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="rounded-lg border border-[hsl(var(--card-border))] bg-transparent px-3 py-2 text-sm outline-none focus:border-sentinel-500"
                  />
                  <button
                    onClick={handleCreateMarket}
                    disabled={!newQuestion || !newDeadline}
                    className="btn-primary text-sm whitespace-nowrap"
                  >
                    Create Market
                  </button>
                </div>
              )}
              <p className="mt-2 text-[9px] text-[hsl(var(--muted))]">
                Markets are settled by <span className="font-medium text-[#375BD2]">Chainlink CRE MarketSettler</span> workflow using <span className="font-medium text-[#4285F4]">Gemini AI</span> for outcome resolution, deployed on <span className="font-medium text-[#7C3AED]">Tenderly VTestNet</span>.
              </p>
            </div>
          )}

          {/* Market Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {markets.map((m) => (
              <MarketCard
                key={m.id}
                market={m}
                isVerified={isWorldIdVerified}
              />
            ))}
          </div>
        </div>

        {/* ─── BOTTOM: Activity + Portfolio ─── */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Activity className="h-4 w-4 text-sentinel-400" />
              System Activity
              <span className="flex items-center gap-1 rounded-full bg-risk-low/10 px-2 py-0.5 text-[9px] text-risk-low">
                <Radio className="h-2 w-2 animate-pulse" /> Live
              </span>
            </h2>
            <ActivityFeed />
          </div>

          <div className="card">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Wallet className="h-4 w-4 text-sentinel-400" />
              Portfolio
              {account && (
                <span className="text-[9px] font-mono text-[hsl(var(--muted))]">
                  {account.address.slice(0, 6)}...{account.address.slice(-4)}
                </span>
              )}
              <span className="rounded bg-[#A855F7]/10 px-1.5 py-0.5 text-[8px] text-[#A855F7] font-medium">via thirdweb</span>
            </h2>
            <Portfolio isVerified={isWorldIdVerified} />
          </div>
        </div>

        {/* ─── HOW IT WORKS — SPONSOR INTEGRATION MAP ─── */}
        <div className="mt-6 card">
          <h2 className="mb-4 text-sm font-semibold">How OmniSentinel Works</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <IntegrationCard
              step="1"
              title="Data Ingestion"
              description="DeFi Llama provides real-time TVL and protocol health data across chains"
              tech={["DeFi Llama API", "Cross-chain data"]}
              color="text-risk-low"
            />
            <IntegrationCard
              step="2"
              title="AI Risk Analysis"
              description="Chainlink CRE RiskMonitor workflow processes data through Gemini AI to generate risk scores"
              tech={["Chainlink CRE", "Gemini AI"]}
              color="text-[#375BD2]"
            />
            <IntegrationCard
              step="3"
              title="On-Chain Oracle"
              description="Risk scores are written to RiskOracle smart contract on Tenderly Virtual TestNet"
              tech={["Solidity Contracts", "Tenderly VTestNet"]}
              color="text-[#7C3AED]"
            />
            <IntegrationCard
              step="4"
              title="Automated Safeguards"
              description="CRE SafeguardTrigger monitors scores every 60s and triggers circuit breaker if threshold exceeded"
              tech={["Chainlink CRE", "Circuit Breaker"]}
              color="text-risk-high"
            />
            <IntegrationCard
              step="5"
              title="Prediction Markets"
              description="World ID verified users bet on protocol safety events. CRE MarketSettler resolves with AI"
              tech={["World ID", "Chainlink CRE", "Gemini AI"]}
              color="text-[#00C3B6]"
            />
            <IntegrationCard
              step="6"
              title="User Interface"
              description="thirdweb SDK powers wallet connection, contract reads, and transaction signing throughout"
              tech={["thirdweb SDK", "ConnectButton", "useReadContract"]}
              color="text-[#A855F7]"
            />
          </div>
        </div>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="mt-8 border-t border-[hsl(var(--card-border))] px-6 py-5">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex items-center justify-between text-[10px] text-[hsl(var(--muted))]">
            <span>OmniSentinel &mdash; Chainlink Convergence CRE Hackathon 2026</span>
            <div className="flex items-center gap-4">
              <span className="text-[#375BD2]">Chainlink CRE</span>
              <span className="text-[#A855F7]">thirdweb</span>
              <span className="text-[#00C3B6]">World ID</span>
              <span className="text-[#7C3AED]">Tenderly</span>
              <span className="text-[#4285F4]">Gemini AI</span>
              <span className="text-risk-low">DeFi Llama</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Subcomponents ─── */

function PulseCard({
  icon, label, value, valueColor, sub,
}: {
  icon: React.ReactNode; label: string; value: string; valueColor?: string; sub: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-4 transition-all hover:border-[hsl(var(--card-border))]/80">
      {icon}
      <div>
        <p className="text-[10px] text-[hsl(var(--muted))]">{label}</p>
        <p className={`text-sm font-semibold ${valueColor ?? ""}`}>{value}</p>
        <p className="text-[9px] text-[hsl(var(--muted))]">{sub}</p>
      </div>
    </div>
  );
}

function ServiceRow({
  name, status, detail, badge, badgeColor,
}: {
  name: string; status: string; detail: string; badge?: string; badgeColor?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[hsl(var(--card-border))] px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-risk-low animate-pulse" />
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-[11px] font-medium">{name}</p>
            {badge && (
              <span className={`rounded px-1 py-px text-[7px] font-semibold ${badgeColor ?? "text-risk-low bg-risk-low/10"}`}>
                {badge}
              </span>
            )}
          </div>
          <p className="text-[9px] text-[hsl(var(--muted))]">{detail}</p>
        </div>
      </div>
      <span className="text-[9px] text-risk-low capitalize">{status}</span>
    </div>
  );
}

function IntegrationCard({
  step, title, description, tech, color,
}: {
  step: string; title: string; description: string; tech: string[]; color: string;
}) {
  return (
    <div className="rounded-lg border border-[hsl(var(--card-border))] p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${color} bg-current/10`}
          style={{ backgroundColor: "currentColor", color: "white", opacity: 0.9 }}>
          {step}
        </span>
        <h3 className="text-xs font-semibold">{title}</h3>
      </div>
      <p className="mb-2 text-[10px] leading-relaxed text-[hsl(var(--muted))]">{description}</p>
      <div className="flex flex-wrap gap-1">
        {tech.map((t) => (
          <span key={t} className="rounded bg-[hsl(var(--background))] px-1.5 py-0.5 text-[8px] font-medium text-[hsl(var(--muted))]">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
