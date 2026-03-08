/**
 * Utility Functions — OmniSentinel
 *
 * Shared helpers: className merging (cn), risk score formatting,
 * address formatting, ETH conversion, timestamp formatting,
 * safeguard status labels, and bytes32 encoding.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRiskScore(score: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (score > 90) return { label: "CRITICAL", color: "text-risk-critical", bgColor: "bg-risk-critical/10" };
  if (score > 75) return { label: "HIGH", color: "text-risk-high", bgColor: "bg-risk-high/10" };
  if (score > 50) return { label: "MEDIUM", color: "text-risk-medium", bgColor: "bg-risk-medium/10" };
  return { label: "LOW", color: "text-risk-low", bgColor: "bg-risk-low/10" };
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatEth(wei: bigint): string {
  const eth = Number(wei) / 1e18;
  return eth.toFixed(4);
}

export function formatTimestamp(unix: number): string {
  return new Date(unix * 1000).toLocaleString();
}

export const STATUS_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: "ACTIVE", color: "text-risk-low" },
  1: { label: "PAUSED", color: "text-risk-medium" },
  2: { label: "LIMITED", color: "text-risk-high" },
  3: { label: "EMERGENCY", color: "text-risk-critical" },
};

export function encodeBytes32String(str: string): string {
  const hex = Array.from(new TextEncoder().encode(str))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return "0x" + hex.padEnd(64, "0");
}
