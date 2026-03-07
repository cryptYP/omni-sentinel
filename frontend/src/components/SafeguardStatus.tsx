"use client";

import { useReadContract } from "thirdweb/react";
import { getSafeguardController } from "@/lib/contracts";
import { STATUS_LABELS } from "@/lib/utils";
import { ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";

export function SafeguardStatus() {
  const safeguard = getSafeguardController();

  const { data: status } = useReadContract({
    contract: safeguard,
    method: "currentStatus",
  });

  const { data: history } = useReadContract({
    contract: safeguard,
    method: "getSafeguardHistory",
  });

  const currentStatus = status !== undefined ? Number(status) : 0;
  const statusInfo = STATUS_LABELS[currentStatus] ?? STATUS_LABELS[0];

  const StatusIcon =
    currentStatus === 0
      ? ShieldCheck
      : currentStatus === 3
        ? ShieldX
        : ShieldAlert;

  return (
    <div className="card h-full">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <StatusIcon
          className={`h-5 w-5 ${statusInfo.color}`}
        />
        Safeguard Controller
      </h2>

      {/* Current Status */}
      <div
        className={`mb-4 flex items-center justify-center rounded-lg border border-[hsl(var(--card-border))] p-6 ${
          currentStatus === 3
            ? "bg-risk-critical/5"
            : currentStatus > 0
              ? "bg-risk-medium/5"
              : "bg-risk-low/5"
        }`}
      >
        <div className="text-center">
          <StatusIcon className={`mx-auto mb-2 h-10 w-10 ${statusInfo.color}`} />
          <p className={`text-2xl font-bold ${statusInfo.color}`}>
            {statusInfo.label}
          </p>
          <p className="mt-1 text-xs text-[hsl(var(--muted))]">
            CRE monitors risk every 60 seconds
          </p>
        </div>
      </div>

      {/* Safeguard History */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-[hsl(var(--muted))]">
          Recent Events
        </h3>
        {history && (history as unknown[]).length > 0 ? (
          <div className="space-y-2">
            {(history as unknown as Array<{
              riskScore: bigint;
              action: number;
              executedAt: bigint;
            }>)
              .slice(-5)
              .reverse()
              .map((event, i) => {
                const actionLabels = ["PAUSE", "LIMIT", "EMERGENCY"];
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-[hsl(var(--card-border))] p-3 text-xs"
                  >
                    <span className="font-mono">
                      Score: {Number(event.riskScore)}
                    </span>
                    <span
                      className={
                        event.action === 2
                          ? "text-risk-critical"
                          : event.action === 1
                            ? "text-risk-high"
                            : "text-risk-medium"
                      }
                    >
                      {actionLabels[event.action] ?? "UNKNOWN"}
                    </span>
                  </div>
                );
              })}
          </div>
        ) : (
          <p className="text-center text-xs text-[hsl(var(--muted))] py-4">
            No safeguard events yet — system is clean.
          </p>
        )}
      </div>
    </div>
  );
}
