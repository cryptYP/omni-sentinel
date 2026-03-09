/**
 * Tenderly VTestNet Auto-Rotation Client
 *
 * Detects block height limit errors from on-chain calls and automatically
 * triggers rotation to a new Virtual TestNet. Maintains a history of
 * previous VTestNet RPC URLs for historical data access.
 *
 * Sponsors: Tenderly Virtual TestNets
 */

const STORAGE_KEY = "omni_sentinel_vnet_history";
const ACTIVE_RPC_KEY = "omni_sentinel_active_rpc";

export type VNetRecord = {
  id: string;
  slug: string;
  displayName: string;
  chainId: number;
  adminRpc: string;
  publicRpc: string;
  explorerUrl: string | null;
  createdAt: string;
  retired?: boolean;
};

// Error patterns that indicate block height limit reached
const BLOCK_LIMIT_PATTERNS = [
  "maximum block height",
  "block height limit",
  "max block",
  "block limit reached",
  "exceeded the maximum",
  "virtual testnet limit",
  "execution reverted", // sometimes manifests as generic revert at limit
];

/**
 * Check if an error is a block height limit error
 */
export function isBlockLimitError(error: unknown): boolean {
  const msg = error instanceof Error
    ? error.message.toLowerCase()
    : String(error).toLowerCase();
  return BLOCK_LIMIT_PATTERNS.some((pattern) => msg.includes(pattern));
}

/**
 * Get VTestNet history from localStorage
 */
export function getVNetHistory(): VNetRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

/**
 * Save a new VTestNet record to history
 */
function saveVNetRecord(record: VNetRecord) {
  if (typeof window === "undefined") return;
  const history = getVNetHistory();
  // Mark all existing as retired
  history.forEach((h) => (h.retired = true));
  history.unshift(record);
  // Keep last 10
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 10)));
  localStorage.setItem(ACTIVE_RPC_KEY, record.publicRpc);
}

/**
 * Get the active RPC override (if rotated)
 */
export function getActiveRpcOverride(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_RPC_KEY);
}

/**
 * Rotate to a new VTestNet. Returns the new VNet info or null on failure.
 */
export type RotationResult = {
  vnet: VNetRecord | null;
  error?: string;
};

export async function rotateVTestNet(
  reason = "block_limit_reached"
): Promise<RotationResult> {
  try {
    const res = await fetch("/api/tenderly/rotate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });

    const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));

    if (!res.ok || !data.success || !data.vnet) {
      const errMsg = data.details || data.error || `API returned ${res.status}`;
      console.error("VTestNet rotation API error:", errMsg);
      return { vnet: null, error: errMsg };
    }

    const record: VNetRecord = data.vnet;
    saveVNetRecord(record);

    console.log(
      `[OmniSentinel] Rotated to new VTestNet: ${record.displayName}`,
      record.publicRpc
    );

    return { vnet: record };
  } catch (err: any) {
    const errMsg = err.message || "Network error";
    console.error("VTestNet rotation failed:", errMsg);
    return { vnet: null, error: errMsg };
  }
}

/**
 * Check current VTestNet health
 */
export async function checkVTestNetHealth(): Promise<{
  healthy: boolean;
  blockNumber?: number;
  needsRotation?: boolean;
}> {
  try {
    const res = await fetch("/api/tenderly/rotate");
    return await res.json();
  } catch {
    return { healthy: false, needsRotation: true };
  }
}

/**
 * Wrap an async on-chain call with auto-rotation on block limit errors.
 * If the call fails due to block limits, rotates to a new VTestNet,
 * shows a notification, and returns the error so the caller can retry.
 */
export async function withAutoRotation<T>(
  fn: () => Promise<T>,
  onRotated?: (vnet: VNetRecord) => void
): Promise<{ result?: T; rotated?: VNetRecord; error?: Error }> {
  try {
    const result = await fn();
    return { result };
  } catch (error: any) {
    if (isBlockLimitError(error)) {
      console.warn("[OmniSentinel] Block limit detected, rotating VTestNet...");
      const result = await rotateVTestNet();
      if (result.vnet) {
        onRotated?.(result.vnet);
        return { rotated: result.vnet, error };
      }
    }
    return { error };
  }
}
