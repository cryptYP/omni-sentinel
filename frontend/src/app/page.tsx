/**
 * Main Page — OmniSentinel Dashboard
 *
 * Three-view layout: Consumer (risk dashboard, prediction markets, portfolio),
 * Developer (CRE pipeline, service status, architecture docs), and Settings
 * (dynamic theme, chart, display, data, and risk color configuration).
 *
 * Sponsors: thirdweb (ConnectButton, wallet), World ID (verification gate),
 * Chainlink CRE (pipeline visualization), Tenderly VTestNet (chain config),
 * Gemini AI (risk analysis reference), DeFi Llama (live protocol data)
 */
"use client";

import { useState, useEffect, Fragment } from "react";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { client } from "@/lib/thirdweb";
import { tenderlyVTestNet } from "@/lib/contracts";
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
  Settings,
  Palette,
  Type,
  Maximize2,
  Gauge,
  Eye,
  RotateCcw,
} from "lucide-react";

export default function Home() {
  const [activeProtocol, setActiveProtocol] = useState("aave");
  const [newQuestion, setNewQuestion] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [isWorldIdVerified, setIsWorldIdVerified] = useState(false);
  const [markets, setMarkets] = useState<ReturnType<typeof getDemoMarkets>>([]);
  const [activeTab, setActiveTab] = useState<"markets" | "create">("markets");
  const [pageView, setPageView] = useState<"consumer" | "dev" | "settings">("consumer");
  const [mounted, setMounted] = useState(false);
  const [marketFilter, setMarketFilter] = useState<string>("All");
  const [protocolFilter, setProtocolFilter] = useState<string>("All");

  // Settings state
  const [settingsThemeMode, setSettingsThemeMode] = useState("Dark");
  const [settingsAccentColor, setSettingsAccentColor] = useState("Indigo");
  const [settingsDensity, setSettingsDensity] = useState("Comfortable");
  const [settingsFontSize, setSettingsFontSize] = useState("Medium");
  const [settingsBorderRadius, setSettingsBorderRadius] = useState("Subtle");
  const [settingsChartStyle, setSettingsChartStyle] = useState("Area");
  const [settingsAnimation, setSettingsAnimation] = useState(true);
  const [settingsChartHeight, setSettingsChartHeight] = useState("Medium");
  const [settingsDecimalPrecision, setSettingsDecimalPrecision] = useState("3");
  const [settingsUpdateInterval, setSettingsUpdateInterval] = useState("120");
  const [settingsLowRisk, setSettingsLowRisk] = useState("#22c55e");
  const [settingsMedRisk, setSettingsMedRisk] = useState("#eab308");
  const [settingsHighRisk, setSettingsHighRisk] = useState("#f97316");
  const [settingsCritRisk, setSettingsCritRisk] = useState("#ef4444");
  const [settingsGridLines, setSettingsGridLines] = useState(true);
  const [settingsNumberFormat, setSettingsNumberFormat] = useState("Compact");
  const [settingsShowTooltips, setSettingsShowTooltips] = useState(true);
  const [settingsDisplayCurrency, setSettingsDisplayCurrency] = useState("ETH");

  // Initialize demo markets on client only to avoid hydration mismatch
  useEffect(() => {
    setMarkets(getDemoMarkets());
    setMounted(true);
    // Load settings from localStorage
    try {
      const saved = localStorage.getItem("omni-sentinel-settings");
      if (saved) {
        const s = JSON.parse(saved);
        if (s.themeMode) setSettingsThemeMode(s.themeMode);
        if (s.accentColor) setSettingsAccentColor(s.accentColor);
        if (s.density) setSettingsDensity(s.density);
        if (s.fontSize) setSettingsFontSize(s.fontSize);
        if (s.borderRadius) setSettingsBorderRadius(s.borderRadius);
        if (s.chartStyle) setSettingsChartStyle(s.chartStyle);
        if (s.animation !== undefined) setSettingsAnimation(s.animation);
        if (s.chartHeight) setSettingsChartHeight(s.chartHeight);
        if (s.decimalPrecision) setSettingsDecimalPrecision(s.decimalPrecision);
        if (s.updateInterval) setSettingsUpdateInterval(s.updateInterval);
        if (s.lowRisk) setSettingsLowRisk(s.lowRisk);
        if (s.medRisk) setSettingsMedRisk(s.medRisk);
        if (s.highRisk) setSettingsHighRisk(s.highRisk);
        if (s.critRisk) setSettingsCritRisk(s.critRisk);
        if (s.gridLines !== undefined) setSettingsGridLines(s.gridLines);
        if (s.numberFormat) setSettingsNumberFormat(s.numberFormat);
        if (s.showTooltips !== undefined) setSettingsShowTooltips(s.showTooltips);
        if (s.displayCurrency) setSettingsDisplayCurrency(s.displayCurrency);
      }
    } catch {}
  }, []);
  // Persist settings to localStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem("omni-sentinel-settings", JSON.stringify({
        themeMode: settingsThemeMode,
        accentColor: settingsAccentColor,
        density: settingsDensity,
        fontSize: settingsFontSize,
        borderRadius: settingsBorderRadius,
        chartStyle: settingsChartStyle,
        animation: settingsAnimation,
        chartHeight: settingsChartHeight,
        decimalPrecision: settingsDecimalPrecision,
        updateInterval: settingsUpdateInterval,
        lowRisk: settingsLowRisk,
        medRisk: settingsMedRisk,
        highRisk: settingsHighRisk,
        critRisk: settingsCritRisk,
        gridLines: settingsGridLines,
        numberFormat: settingsNumberFormat,
        showTooltips: settingsShowTooltips,
        displayCurrency: settingsDisplayCurrency,
      }));
    } catch {}
  }, [mounted, settingsThemeMode, settingsAccentColor, settingsDensity, settingsFontSize, settingsBorderRadius, settingsChartStyle, settingsAnimation, settingsChartHeight, settingsDecimalPrecision, settingsUpdateInterval, settingsLowRisk, settingsMedRisk, settingsHighRisk, settingsCritRisk, settingsGridLines, settingsNumberFormat, settingsShowTooltips, settingsDisplayCurrency]);

  // ─── APPLY SETTINGS DYNAMICALLY ───
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;

    // Theme mode
    root.classList.remove("theme-light");
    if (settingsThemeMode === "Light") {
      root.classList.add("theme-light");
    } else if (settingsThemeMode === "Auto") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (!prefersDark) root.classList.add("theme-light");
    }

    // Accent color → sentinel CSS variable overrides
    const accentMap: Record<string, { h: string; s: string; l: string; c600: string; c400: string }> = {
      Indigo:  { h: "231", s: "48%", l: "48%", c600: "#4c6ef5", c400: "#748ffc" },
      Emerald: { h: "160", s: "84%", l: "39%", c600: "#059669", c400: "#34d399" },
      Rose:    { h: "350", s: "89%", l: "60%", c600: "#e11d48", c400: "#fb7185" },
      Amber:   { h: "38",  s: "92%", l: "50%", c600: "#d97706", c400: "#fbbf24" },
      Cyan:    { h: "192", s: "91%", l: "36%", c600: "#0891b2", c400: "#22d3ee" },
    };
    const accent = accentMap[settingsAccentColor] ?? accentMap.Indigo;
    root.style.setProperty("--accent-h", accent.h);
    root.style.setProperty("--accent-s", accent.s);
    root.style.setProperty("--accent-l", accent.l);
    root.style.setProperty("--sentinel-600", accent.c600);
    root.style.setProperty("--sentinel-400", accent.c400);

    // Font size
    const fontMap: Record<string, string> = { Small: "0.9", Medium: "1", Large: "1.12" };
    root.style.setProperty("--font-scale", fontMap[settingsFontSize] ?? "1");

    // Density (spacing scale)
    const densityMap: Record<string, string> = { Compact: "0.8", Comfortable: "1", Spacious: "1.25" };
    root.style.setProperty("--spacing-scale", densityMap[settingsDensity] ?? "1");

    // Border radius
    const radiusMap: Record<string, string> = { Sharp: "0px", Subtle: "0.75rem", Rounded: "1.25rem" };
    const r = radiusMap[settingsBorderRadius] ?? "0.75rem";
    root.style.setProperty("--radius-base", r);
    root.style.setProperty("--radius-card", r);

    // Chart height
    const chartHeightMap: Record<string, string> = { Short: "10rem", Medium: "16rem", Tall: "22rem" };
    root.style.setProperty("--chart-height", chartHeightMap[settingsChartHeight] ?? "16rem");

    // Risk colors
    root.style.setProperty("--risk-low", settingsLowRisk);
    root.style.setProperty("--risk-med", settingsMedRisk);
    root.style.setProperty("--risk-high", settingsHighRisk);
    root.style.setProperty("--risk-crit", settingsCritRisk);
  }, [mounted, settingsThemeMode, settingsAccentColor, settingsFontSize, settingsDensity, settingsBorderRadius, settingsChartHeight, settingsLowRisk, settingsMedRisk, settingsHighRisk, settingsCritRisk]);

  function resetSettingsToDefaults() {
    setSettingsThemeMode("Dark");
    setSettingsAccentColor("Indigo");
    setSettingsDensity("Comfortable");
    setSettingsFontSize("Medium");
    setSettingsBorderRadius("Subtle");
    setSettingsChartStyle("Area");
    setSettingsAnimation(true);
    setSettingsChartHeight("Medium");
    setSettingsDecimalPrecision("3");
    setSettingsUpdateInterval("120");
    setSettingsLowRisk("#22c55e");
    setSettingsMedRisk("#eab308");
    setSettingsHighRisk("#f97316");
    setSettingsCritRisk("#ef4444");
    setSettingsGridLines(true);
    setSettingsNumberFormat("Compact");
    setSettingsShowTooltips(true);
    setSettingsDisplayCurrency("ETH");
    // Clear theme class
    document.documentElement.classList.remove("theme-light");
  }

  const account = useActiveAccount();

  const { protocols, loading: protocolsLoading, lastUpdated } = useDefiProtocols(parseInt(settingsUpdateInterval));

  // Format TVL based on Number Format setting
  function formatTvl(tvl: number): string {
    if (settingsNumberFormat === "Full") {
      return "$" + tvl.toLocaleString("en-US", { maximumFractionDigits: 0 });
    }
    // Compact format (default)
    if (tvl >= 1e9) return `$${(tvl / 1e9).toFixed(2)}B`;
    if (tvl >= 1e6) return `$${(tvl / 1e6).toFixed(2)}M`;
    if (tvl >= 1e3) return `$${(tvl / 1e3).toFixed(1)}K`;
    return `$${tvl.toFixed(0)}`;
  }

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

          {/* Page View Tabs */}
          <div className="flex items-center rounded-lg bg-[hsl(var(--card))]/60 border border-[hsl(var(--card-border))] p-0.5">
            <button
              onClick={() => setPageView("consumer")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium transition ${
                pageView === "consumer"
                  ? "bg-sentinel-600/20 text-sentinel-400"
                  : "text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
              }`}
            >
              <Shield className="h-3 w-3" />
              Consumer
            </button>
            <button
              onClick={() => setPageView("dev")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium transition ${
                pageView === "dev"
                  ? "bg-sentinel-600/20 text-sentinel-400"
                  : "text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
              }`}
            >
              <Zap className="h-3 w-3" />
              Developer
            </button>
            <button
              onClick={() => setPageView("settings")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium transition ${
                pageView === "settings"
                  ? "bg-sentinel-600/20 text-sentinel-400"
                  : "text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
              }`}
            >
              <Settings className="h-3 w-3" />
              Settings
            </button>
          </div>

          <div className="flex items-center gap-3">
            <WorldIDAuth onVerified={() => setIsWorldIdVerified(true)} />
            <ConnectButton
              client={client}
              chains={[tenderlyVTestNet]}
              chain={tenderlyVTestNet}
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
              switchButton={{
                label: "Switch to Tenderly",
                style: {
                  backgroundColor: "hsl(270, 60%, 35%)",
                  border: "1px solid hsl(270, 50%, 45%)",
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

        {/* ════════════════════════════════════════════════════════ */}
        {/* ─── CONSUMER VIEW ─── */}
        {/* ════════════════════════════════════════════════════════ */}
        {pageView === "consumer" && (
          <>
            {/* ─── LIVE PROTOCOL HEALTH STRIP ─── */}
            {!protocolsLoading && protocols.length > 0 && (
              <div className="mb-6 overflow-x-auto">
                <div className="flex gap-2">
                  {[...protocols].sort((a, b) => {
                    const order = ["aave", "compound", "lido", "maker", "uniswap"];
                    return order.indexOf(a.slug) - order.indexOf(b.slug);
                  }).map((p) => (
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
                          {formatTvl(p.tvl)} · Risk {p.riskScore}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Risk Intelligence (full width) ─── */}
            <div className="mb-6 card">
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

              <RiskChart activeProtocol={activeProtocol} onProtocolChange={setActiveProtocol} chartStyle={settingsChartStyle} chartHeight={settingsChartHeight} animation={settingsAnimation} gridLines={settingsGridLines} showTooltips={settingsShowTooltips} numberFormat={settingsNumberFormat} />
            </div>

            {/* ─── Circuit Breaker + Portfolio row ─── */}
            <div className="mb-6 grid gap-6 lg:grid-cols-2">
              {/* Circuit Breaker */}
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
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-[hsl(var(--card-border))] bg-[hsl(var(--background))] p-2.5 text-center">
                    <p className="text-[9px] text-[hsl(var(--muted))]">Average Risk Score</p>
                    <p className={`text-base font-bold ${avgRisk > 50 ? "text-risk-high" : "text-risk-low"}`}>{avgRisk}<span className="text-[9px] font-normal text-[hsl(var(--muted))]">/100</span></p>
                  </div>
                  <div className="rounded-lg border border-[hsl(var(--card-border))] bg-[hsl(var(--background))] p-2.5 text-center">
                    <p className="text-[9px] text-[hsl(var(--muted))]">Protocols Above Threshold</p>
                    <p className={`text-base font-bold ${highRiskCount > 0 ? "text-risk-high" : "text-risk-low"}`}>{highRiskCount}<span className="text-[9px] font-normal text-[hsl(var(--muted))]">/{protocols.length}</span></p>
                  </div>
                  <div className="rounded-lg border border-[hsl(var(--card-border))] bg-[hsl(var(--background))] p-2.5 text-center">
                    <p className="text-[9px] text-[hsl(var(--muted))]">Trigger Threshold</p>
                    <p className="text-base font-bold text-[hsl(var(--foreground))]">70<span className="text-[9px] font-normal text-[hsl(var(--muted))]">/100</span></p>
                  </div>
                  <div className="rounded-lg border border-[hsl(var(--card-border))] bg-[hsl(var(--background))] p-2.5 text-center">
                    <p className="text-[9px] text-[hsl(var(--muted))]">Check Interval</p>
                    <p className="text-base font-bold text-[hsl(var(--foreground))]">60<span className="text-[9px] font-normal text-[hsl(var(--muted))]">s</span></p>
                  </div>
                </div>
                <div className="mt-2 rounded-lg bg-[hsl(var(--background))] px-3 py-2 text-[9px] text-[hsl(var(--muted))]">
                  <span className="font-medium">How it works:</span> CRE reads RiskOracle every 60s. If score {">"} 70, SafeguardController circuit breaker engages automatically on-chain.
                </div>
              </div>

              {/* Portfolio */}
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

            {/* ─── PREDICTION MARKETS ─── */}
            <div className="mb-6">
              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
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

                {/* Filter Row */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-medium text-[hsl(var(--muted))] uppercase tracking-wider">Category</span>
                    <div className="flex items-center gap-1">
                      {["All", "TVL", "Staking", "Safety", "Stability", "Market", "Custom"].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setMarketFilter(cat)}
                          className={`rounded-full px-2.5 py-0.5 text-[9px] font-medium transition ${
                            marketFilter === cat
                              ? "bg-sentinel-600/20 text-sentinel-400"
                              : "bg-[hsl(var(--background))] text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="h-4 w-px bg-[hsl(var(--card-border))]" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-medium text-[hsl(var(--muted))] uppercase tracking-wider">Protocol</span>
                    <div className="flex items-center gap-1">
                      {["All", "Aave", "Lido", "Compound", "Sky/Maker", "DeFi"].map((proto) => (
                        <button
                          key={proto}
                          onClick={() => setProtocolFilter(proto)}
                          className={`rounded-full px-2.5 py-0.5 text-[9px] font-medium transition ${
                            protocolFilter === proto
                              ? "bg-sentinel-600/20 text-sentinel-400"
                              : "bg-[hsl(var(--background))] text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                          }`}
                        >
                          {proto}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
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
                {markets
                  .filter(m => marketFilter === "All" || m.category === marketFilter)
                  .filter(m => protocolFilter === "All" || m.protocol === protocolFilter)
                  .map((m) => (
                  <MarketCard
                    key={m.id}
                    market={m}
                    isVerified={isWorldIdVerified}
                    decimalPrecision={parseInt(settingsDecimalPrecision)}
                    displayCurrency={settingsDisplayCurrency}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* ─── DEVELOPER VIEW ─── */}
        {/* ════════════════════════════════════════════════════════ */}
        {pageView === "dev" && (
          <>
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

            {/* ─── CRE Data Pipeline ─── */}
            <div className="mb-6 card">
              <div className="mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-sentinel-400" />
                <h2 className="text-sm font-semibold">Chainlink CRE Data Pipeline</h2>
              </div>
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

            {/* ─── Health Calculation Methodology ─── */}
            <div className="mb-6 card">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <BarChart3 className="h-4 w-4 text-sentinel-400" />
                Health Calculation Methodology
              </h2>
              <div className="mb-3 space-y-2 text-[10px] text-[hsl(var(--muted))] leading-relaxed">
                <p>
                  <span className="font-medium text-[hsl(var(--foreground))]">System Health</span> is calculated as the average risk score across all monitored protocols. If the average exceeds 50, the system status changes to &ldquo;Elevated Risk.&rdquo;
                </p>
                <p>
                  <span className="font-medium text-[hsl(var(--foreground))]">Risk Score Formula:</span> Base score from TVL tier + volatility adjustment (day-over-day and 7-day TVL changes) + rolling 7-day standard deviation.
                </p>
                <div>
                  <span className="font-medium text-[hsl(var(--foreground))]">TVL Tiers (Base Score):</span>
                  <div className="mt-1 grid grid-cols-5 gap-1.5">
                    <div className="rounded border border-[hsl(var(--card-border))] bg-[hsl(var(--background))] px-2 py-1 text-center">
                      <p className="text-[8px] text-[hsl(var(--muted))]">{">"}$10B</p>
                      <p className="text-xs font-bold text-risk-low">18</p>
                    </div>
                    <div className="rounded border border-[hsl(var(--card-border))] bg-[hsl(var(--background))] px-2 py-1 text-center">
                      <p className="text-[8px] text-[hsl(var(--muted))]">{">"}$5B</p>
                      <p className="text-xs font-bold text-risk-low">32</p>
                    </div>
                    <div className="rounded border border-[hsl(var(--card-border))] bg-[hsl(var(--background))] px-2 py-1 text-center">
                      <p className="text-[8px] text-[hsl(var(--muted))]">{">"}$1B</p>
                      <p className="text-xs font-bold text-[#fab005]">48</p>
                    </div>
                    <div className="rounded border border-[hsl(var(--card-border))] bg-[hsl(var(--background))] px-2 py-1 text-center">
                      <p className="text-[8px] text-[hsl(var(--muted))]">{">"}$100M</p>
                      <p className="text-xs font-bold text-risk-high">65</p>
                    </div>
                    <div className="rounded border border-[hsl(var(--card-border))] bg-[hsl(var(--background))] px-2 py-1 text-center">
                      <p className="text-[8px] text-[hsl(var(--muted))]">{"<"}$100M</p>
                      <p className="text-xs font-bold text-risk-high">82</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Per-protocol health table */}
              {!protocolsLoading && protocols.length > 0 && (
                <div className="rounded-lg border border-[hsl(var(--card-border))] overflow-hidden">
                  <div className="grid grid-cols-4 gap-px bg-[hsl(var(--card-border))]">
                    <div className="bg-[hsl(var(--background))] px-3 py-1.5 text-[9px] font-semibold text-[hsl(var(--muted))]">Protocol</div>
                    <div className="bg-[hsl(var(--background))] px-3 py-1.5 text-[9px] font-semibold text-[hsl(var(--muted))]">TVL</div>
                    <div className="bg-[hsl(var(--background))] px-3 py-1.5 text-[9px] font-semibold text-[hsl(var(--muted))]">Risk Score</div>
                    <div className="bg-[hsl(var(--background))] px-3 py-1.5 text-[9px] font-semibold text-[hsl(var(--muted))]">Risk Level</div>
                    {[...protocols].sort((a, b) => {
                      const order = ["aave", "compound", "lido", "maker", "uniswap"];
                      return order.indexOf(a.slug) - order.indexOf(b.slug);
                    }).map((p) => (
                      <Fragment key={p.slug}>
                        <div className="bg-[hsl(var(--card))] px-3 py-1.5 text-[10px] font-medium">{p.name}</div>
                        <div key={`${p.slug}-tvl`} className="bg-[hsl(var(--card))] px-3 py-1.5 text-[10px] text-[hsl(var(--muted))]">{formatTvl(p.tvl)}</div>
                        <div key={`${p.slug}-score`} className={`bg-[hsl(var(--card))] px-3 py-1.5 text-[10px] font-bold ${p.riskScore > 50 ? "text-risk-high" : "text-risk-low"}`}>{p.riskScore}/100</div>
                        <div key={`${p.slug}-level`} className="bg-[hsl(var(--card))] px-3 py-1.5">
                          <span className={`rounded px-1.5 py-0.5 text-[8px] font-medium ${
                            p.riskScore > 75 ? "bg-risk-high/10 text-risk-high" :
                            p.riskScore > 50 ? "bg-[#fd7e14]/10 text-[#fd7e14]" :
                            p.riskScore > 30 ? "bg-[#fab005]/10 text-[#fab005]" :
                            "bg-risk-low/10 text-risk-low"
                          }`}>
                            {p.riskScore > 75 ? "Critical" : p.riskScore > 50 ? "High" : p.riskScore > 30 ? "Medium" : "Low"}
                          </span>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ─── Service Status (full width) ─── */}
            <div className="mb-6 card">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Server className="h-4 w-4 text-sentinel-400" />
                Service Status
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <ServiceRow name="DeFi Llama API" status="connected" detail="Live protocol TVL data" badge="Data Source" />
                <ServiceRow name="Chainlink CRE" status="running" detail="3 workflows active" badge="Orchestration" badgeColor="text-[#375BD2] bg-[#375BD2]/10" />
                <ServiceRow name="thirdweb SDK" status="connected" detail="Wallet + contract calls" badge="Web3" badgeColor="text-[#A855F7] bg-[#A855F7]/10" />
                <ServiceRow name="World ID" status="ready" detail="Sybil-resistant gating" badge="Identity" badgeColor="text-[#00C3B6] bg-[#00C3B6]/10" />
                <ServiceRow name="Tenderly VTestNet" status="connected" detail="Chain ID 73571" badge="Testnet" badgeColor="text-[#7C3AED] bg-[#7C3AED]/10" />
                <ServiceRow name="Gemini AI" status="ready" detail="Risk analysis engine" badge="AI" badgeColor="text-[#4285F4] bg-[#4285F4]/10" />
              </div>
            </div>

            {/* ─── System Activity ─── */}
            <div className="mb-6 card">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <Activity className="h-4 w-4 text-sentinel-400" />
                System Activity
                <span className="flex items-center gap-1 rounded-full bg-risk-low/10 px-2 py-0.5 text-[9px] text-risk-low">
                  <Radio className="h-2 w-2 animate-pulse" /> Live
                </span>
              </h2>
              <ActivityFeed />
            </div>

            {/* ─── HOW IT WORKS — SPONSOR INTEGRATION MAP ─── */}
            <div className="card">
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
          </>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* ─── SETTINGS VIEW ─── */}
        {/* ════════════════════════════════════════════════════════ */}
        {pageView === "settings" && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-sentinel-400" />
              <h2 className="text-lg font-bold">Settings</h2>
            </div>

            {/* Theme */}
            <div className="card">
              <div className="mb-4 flex items-center gap-2">
                <Palette className="h-4 w-4 text-sentinel-400" />
                <h3 className="text-sm font-semibold">Theme</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-[10px] font-medium text-[hsl(var(--muted))] uppercase tracking-wider">Mode</p>
                  <div className="flex gap-2">
                    {["Dark", "Light", "Auto"].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setSettingsThemeMode(mode)}
                        className={`rounded-lg px-4 py-2 text-[11px] font-medium transition ${
                          settingsThemeMode === mode
                            ? "bg-sentinel-600/20 text-sentinel-400 border border-sentinel-600/40"
                            : "border border-[hsl(var(--card-border))] text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-medium text-[hsl(var(--muted))] uppercase tracking-wider">Accent Color</p>
                  <div className="flex gap-2">
                    {[
                      { name: "Indigo", color: "#6366f1" },
                      { name: "Emerald", color: "#10b981" },
                      { name: "Rose", color: "#f43f5e" },
                      { name: "Amber", color: "#f59e0b" },
                      { name: "Cyan", color: "#06b6d4" },
                    ].map((accent) => (
                      <button
                        key={accent.name}
                        onClick={() => setSettingsAccentColor(accent.name)}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-medium transition ${
                          settingsAccentColor === accent.name
                            ? "border border-sentinel-600/40 bg-sentinel-600/10"
                            : "border border-[hsl(var(--card-border))] hover:border-[hsl(var(--card-border))]/80"
                        }`}
                      >
                        <span
                          className="h-4 w-4 rounded-full border-2 border-white/20"
                          style={{ backgroundColor: accent.color }}
                        />
                        <span className={settingsAccentColor === accent.name ? "text-sentinel-400" : "text-[hsl(var(--muted))]"}>
                          {accent.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Display */}
            <div className="card">
              <div className="mb-4 flex items-center gap-2">
                <Maximize2 className="h-4 w-4 text-sentinel-400" />
                <h3 className="text-sm font-semibold">Display</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-[10px] font-medium text-[hsl(var(--muted))] uppercase tracking-wider">Density</p>
                  <div className="flex gap-2">
                    {["Compact", "Comfortable", "Spacious"].map((d) => (
                      <button
                        key={d}
                        onClick={() => setSettingsDensity(d)}
                        className={`rounded-lg px-4 py-2 text-[11px] font-medium transition ${
                          settingsDensity === d
                            ? "bg-sentinel-600/20 text-sentinel-400 border border-sentinel-600/40"
                            : "border border-[hsl(var(--card-border))] text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-medium text-[hsl(var(--muted))] uppercase tracking-wider">Font Size</p>
                  <div className="flex gap-2">
                    {["Small", "Medium", "Large"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSettingsFontSize(s)}
                        className={`rounded-lg px-4 py-2 text-[11px] font-medium transition ${
                          settingsFontSize === s
                            ? "bg-sentinel-600/20 text-sentinel-400 border border-sentinel-600/40"
                            : "border border-[hsl(var(--card-border))] text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-medium text-[hsl(var(--muted))] uppercase tracking-wider">Border Radius</p>
                  <div className="flex gap-2">
                    {[
                      { label: "Sharp", value: "Sharp", desc: "0px" },
                      { label: "Subtle", value: "Subtle", desc: "8px" },
                      { label: "Rounded", value: "Rounded", desc: "16px" },
                    ].map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setSettingsBorderRadius(r.value)}
                        className={`rounded-lg px-4 py-2 text-[11px] font-medium transition ${
                          settingsBorderRadius === r.value
                            ? "bg-sentinel-600/20 text-sentinel-400 border border-sentinel-600/40"
                            : "border border-[hsl(var(--card-border))] text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                        }`}
                      >
                        {r.label} <span className="text-[9px] opacity-60">({r.desc})</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="card">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-sentinel-400" />
                <h3 className="text-sm font-semibold">Charts</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-[10px] font-medium text-[hsl(var(--muted))] uppercase tracking-wider">Chart Style</p>
                  <div className="flex gap-2">
                    {["Area", "Line", "Bar", "Candle"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSettingsChartStyle(s)}
                        className={`rounded-lg px-4 py-2 text-[11px] font-medium transition ${
                          settingsChartStyle === s
                            ? "bg-sentinel-600/20 text-sentinel-400 border border-sentinel-600/40"
                            : "border border-[hsl(var(--card-border))] text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-medium text-[hsl(var(--muted))] uppercase tracking-wider">Animation</p>
                  <button
                    onClick={() => setSettingsAnimation(!settingsAnimation)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      settingsAnimation ? "bg-sentinel-600" : "bg-[hsl(var(--card-border))]"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        settingsAnimation ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="ml-2 text-[10px] text-[hsl(var(--muted))]">{settingsAnimation ? "On" : "Off"}</span>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-medium text-[hsl(var(--muted))] uppercase tracking-wider">Chart Height</p>
                  <div className="flex gap-2">
                    {["Short", "Medium", "Tall"].map((h) => (
                      <button
                        key={h}
                        onClick={() => setSettingsChartHeight(h)}
                        className={`rounded-lg px-4 py-2 text-[11px] font-medium transition ${
                          settingsChartHeight === h
                            ? "bg-sentinel-600/20 text-sentinel-400 border border-sentinel-600/40"
                            : "border border-[hsl(var(--card-border))] text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-medium text-[hsl(var(--muted))] uppercase tracking-wider">Grid Lines</p>
                    <p className="text-[9px] text-[hsl(var(--muted))]">Show reference grid on charts</p>
                  </div>
                  <button
                    onClick={() => setSettingsGridLines(!settingsGridLines)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      settingsGridLines ? "bg-sentinel-600" : "bg-[hsl(var(--card-border))]"
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settingsGridLines ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-medium text-[hsl(var(--muted))] uppercase tracking-wider">Show Tooltips</p>
                    <p className="text-[9px] text-[hsl(var(--muted))]">Show data on hover</p>
                  </div>
                  <button
                    onClick={() => setSettingsShowTooltips(!settingsShowTooltips)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      settingsShowTooltips ? "bg-sentinel-600" : "bg-[hsl(var(--card-border))]"
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settingsShowTooltips ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Risk Colors */}
            <div className="card">
              <div className="mb-4 flex items-center gap-2">
                <Eye className="h-4 w-4 text-sentinel-400" />
                <h3 className="text-sm font-semibold">Risk Colors</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Low Risk Color", value: settingsLowRisk, setter: setSettingsLowRisk },
                  { label: "Medium Risk Color", value: settingsMedRisk, setter: setSettingsMedRisk },
                  { label: "High Risk Color", value: settingsHighRisk, setter: setSettingsHighRisk },
                  { label: "Critical Risk Color", value: settingsCritRisk, setter: setSettingsCritRisk },
                ].map((rc) => (
                  <div key={rc.label} className="flex items-center gap-3 rounded-lg border border-[hsl(var(--card-border))] p-3">
                    <input
                      type="color"
                      value={rc.value}
                      onChange={(e) => rc.setter(e.target.value)}
                      className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent"
                    />
                    <div>
                      <p className="text-[11px] font-medium">{rc.label}</p>
                      <p className="text-[9px] font-mono text-[hsl(var(--muted))]">{rc.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Data */}
            <div className="card">
              {/* Live preview */}
              <div className="mb-4 rounded-lg border border-[hsl(var(--card-border))] bg-[hsl(var(--background))] p-3">
                <p className="mb-1.5 text-[9px] font-medium text-[hsl(var(--muted))] uppercase tracking-wider">Live Preview</p>
                <div className="flex items-center gap-4 text-[11px]">
                  <span>
                    <span className="text-[hsl(var(--muted))]">Amount:</span>{" "}
                    <span className="font-mono font-medium">{(2.45).toFixed(parseInt(settingsDecimalPrecision))} ETH</span>
                    {settingsDisplayCurrency !== "ETH" && (() => {
                      const rates: Record<string, { rate: number; sym: string }> = { BTC: { rate: 0.055, sym: "BTC" }, USD: { rate: 2150, sym: "$" }, EUR: { rate: 1980, sym: "\u20AC" }, GBP: { rate: 1700, sym: "\u00A3" }, JPY: { rate: 322000, sym: "\u00A5" } };
                      const r = rates[settingsDisplayCurrency];
                      if (!r) return null;
                      const v = 2.45 * r.rate;
                      return <span className="ml-1 text-[9px] opacity-60">({["USD","EUR","GBP"].includes(settingsDisplayCurrency) ? `${r.sym}${v.toFixed(2)}` : settingsDisplayCurrency === "BTC" ? `${v.toFixed(5)} BTC` : `${r.sym}${Math.round(v).toLocaleString()}`})</span>;
                    })()}
                  </span>
                  <span className="h-3 w-px bg-[hsl(var(--card-border))]" />
                  <span>
                    <span className="text-[hsl(var(--muted))]">TVL:</span>{" "}
                    <span className="font-mono font-medium">{settingsNumberFormat === "Full" ? "$12,500,000,000" : "$12.50B"}</span>
                  </span>
                  <span className="h-3 w-px bg-[hsl(var(--card-border))]" />
                  <span>
                    <span className="text-[hsl(var(--muted))]">Refresh:</span>{" "}
                    <span className="font-mono font-medium">{settingsUpdateInterval}s</span>
                    {lastUpdated > 0 && <span className="ml-1 text-[9px] opacity-60">(last: {new Date(lastUpdated).toLocaleTimeString()})</span>}
                  </span>
                </div>
              </div>
              <div className="mb-4 flex items-center gap-2">
                <Gauge className="h-4 w-4 text-sentinel-400" />
                <h3 className="text-sm font-semibold">Data</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-[10px] font-medium text-[hsl(var(--muted))] uppercase tracking-wider">Display Currency</p>
                  <div className="flex flex-wrap gap-2">
                    {["ETH", "BTC", "USD", "EUR", "GBP", "JPY"].map((c) => (
                      <button
                        key={c}
                        onClick={() => setSettingsDisplayCurrency(c)}
                        className={`rounded-lg px-3 py-2 text-[11px] font-medium transition ${
                          settingsDisplayCurrency === c
                            ? "bg-sentinel-600/20 text-sentinel-400 border border-sentinel-600/40"
                            : "border border-[hsl(var(--card-border))] text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-[9px] text-[hsl(var(--muted))]">
                    Amounts shown in ETH (native). Converted values appear as subtext.
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-medium text-[hsl(var(--muted))] uppercase tracking-wider">Number Format</p>
                  <div className="flex gap-2">
                    {["Compact", "Full"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setSettingsNumberFormat(f)}
                        className={`rounded-lg px-4 py-2 text-[11px] font-medium transition ${
                          settingsNumberFormat === f
                            ? "bg-sentinel-600/20 text-sentinel-400 border border-sentinel-600/40"
                            : "border border-[hsl(var(--card-border))] text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                        }`}
                      >
                        {f} <span className="text-[9px] opacity-60">({f === "Compact" ? "$1.2B" : "$1,200,000,000"})</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-medium text-[hsl(var(--muted))] uppercase tracking-wider">Decimal Precision</p>
                  <div className="flex gap-2">
                    {["2", "3", "4", "6"].map((d) => (
                      <button
                        key={d}
                        onClick={() => setSettingsDecimalPrecision(d)}
                        className={`rounded-lg px-4 py-2 text-[11px] font-medium transition ${
                          settingsDecimalPrecision === d
                            ? "bg-sentinel-600/20 text-sentinel-400 border border-sentinel-600/40"
                            : "border border-[hsl(var(--card-border))] text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-medium text-[hsl(var(--muted))] uppercase tracking-wider">Update Interval</p>
                  <div className="flex gap-2">
                    {[
                      { label: "30s", value: "30" },
                      { label: "60s", value: "60" },
                      { label: "120s", value: "120" },
                      { label: "300s", value: "300" },
                    ].map((i) => (
                      <button
                        key={i.value}
                        onClick={() => setSettingsUpdateInterval(i.value)}
                        className={`rounded-lg px-4 py-2 text-[11px] font-medium transition ${
                          settingsUpdateInterval === i.value
                            ? "bg-sentinel-600/20 text-sentinel-400 border border-sentinel-600/40"
                            : "border border-[hsl(var(--card-border))] text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                        }`}
                      >
                        {i.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Reset */}
            <div className="flex justify-end">
              <button
                onClick={resetSettingsToDefaults}
                className="flex items-center gap-2 rounded-lg border border-risk-high/30 bg-risk-high/5 px-4 py-2 text-[11px] font-medium text-risk-high transition hover:bg-risk-high/10"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset to Defaults
              </button>
            </div>
          </div>
        )}
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
