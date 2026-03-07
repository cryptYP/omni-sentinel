"use client";

import { ConnectButton } from "thirdweb/react";
import { sepolia } from "thirdweb/chains";
import { client } from "@/lib/thirdweb";
import { RiskDashboard } from "@/components/RiskDashboard";
import { PredictionMarkets } from "@/components/PredictionMarkets";
import { SafeguardStatus } from "@/components/SafeguardStatus";
import { WorldIDAuth } from "@/components/WorldIDAuth";
import {
  Shield,
  Activity,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[hsl(var(--card-border))] px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-sentinel-500" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                OmniSentinel
              </h1>
              <p className="text-xs text-[hsl(var(--muted))]">
                AI-Powered Cross-Chain Risk Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <WorldIDAuth />
            <ConnectButton
              client={client}
              chain={sepolia}
              connectButton={{
                label: "Connect Wallet",
                style: {
                  backgroundColor: "#4c6ef5",
                  color: "white",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  padding: "0.5rem 1rem",
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats Row */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Activity className="h-5 w-5 text-sentinel-400" />}
            label="CRE Workflows"
            value="3 Active"
            sub="RiskMonitor · MarketSettler · Safeguard"
          />
          <StatCard
            icon={<Shield className="h-5 w-5 text-risk-low" />}
            label="System Status"
            value="Monitoring"
            sub="Checking every 5 minutes"
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-sentinel-400" />}
            label="Markets"
            value="Live"
            sub="World ID verified betting"
          />
          <StatCard
            icon={<AlertTriangle className="h-5 w-5 text-risk-medium" />}
            label="Safeguard"
            value="Armed"
            sub="Circuit breaker ready"
          />
        </div>

        {/* Main Panels */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Risk Dashboard — spans 2 columns */}
          <div className="lg:col-span-2">
            <RiskDashboard />
          </div>

          {/* Safeguard Status */}
          <div>
            <SafeguardStatus />
          </div>
        </div>

        {/* Prediction Markets — full width */}
        <div className="mt-6">
          <PredictionMarkets />
        </div>

        {/* CRE Workflow Info */}
        <div className="mt-6 card">
          <h2 className="mb-4 text-lg font-semibold">
            Chainlink CRE Workflows
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <WorkflowCard
              name="RiskMonitor"
              trigger="Cron (5 min)"
              description="Fetches DeFi Llama data → Gemini AI analysis → writes risk score onchain"
              status="active"
            />
            <WorkflowCard
              name="MarketSettler"
              trigger="EVM Log"
              description="Listens for SettlementRequested → AI resolution with search grounding → settles market"
              status="active"
            />
            <WorkflowCard
              name="SafeguardTrigger"
              trigger="Cron (1 min)"
              description="Reads onchain risk scores → checks threshold → triggers circuit breaker"
              status="active"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[hsl(var(--card-border))] px-6 py-6 text-center text-sm text-[hsl(var(--muted))]">
        Built with Chainlink CRE · thirdweb · World ID · Tenderly · Gemini AI
      </footer>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="card flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-[hsl(var(--muted))]">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
        <p className="text-xs text-[hsl(var(--muted))]">{sub}</p>
      </div>
    </div>
  );
}

function WorkflowCard({
  name,
  trigger,
  description,
  status,
}: {
  name: string;
  trigger: string;
  description: string;
  status: "active" | "paused";
}) {
  return (
    <div className="rounded-lg border border-[hsl(var(--card-border))] bg-[hsl(var(--card))]/50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-mono text-sm font-semibold">{name}</h3>
        <span className="risk-badge bg-risk-low/10 text-risk-low">
          {status}
        </span>
      </div>
      <p className="mb-2 text-xs text-[hsl(var(--muted))]">
        Trigger: {trigger}
      </p>
      <p className="text-xs leading-relaxed text-[hsl(var(--muted))]">
        {description}
      </p>
    </div>
  );
}
