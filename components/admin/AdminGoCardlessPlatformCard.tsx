"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { AdminGoCardlessPlatformStatus } from "@/app/api/admin/gocardless-platform-status/route";

type StatusRowProps = {
  label: string;
  value: string;
  status: "ok" | "warn" | "neutral";
  detail?: string;
};

function StatusBadge({
  status,
  children,
}: {
  status: StatusRowProps["status"];
  children: React.ReactNode;
}) {
  const styles = {
    ok: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    neutral: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      {children}
    </span>
  );
}

function StatusRow({ label, value, status, detail }: StatusRowProps) {
  return (
    <div className="flex flex-col gap-1 border-b border-zinc-100 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-zinc-900">{label}</p>
        {detail ? (
          <p className="mt-0.5 text-xs text-zinc-500">{detail}</p>
        ) : null}
      </div>
      <StatusBadge status={status}>{value}</StatusBadge>
    </div>
  );
}

export function AdminGoCardlessPlatformCard() {
  const [status, setStatus] = useState<AdminGoCardlessPlatformStatus | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/gocardless-platform-status");
      if (!response.ok) {
        throw new Error("Unable to load GoCardless platform status.");
      }
      const data = (await response.json()) as AdminGoCardlessPlatformStatus;
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  return (
    <article className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              GoCardless Platform Setup
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Platform credentials, fee split, and club connect readiness.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/finance/payment-providers/gocardless"
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Manage GoCardless
            </Link>
            <button
            type="button"
            onClick={() => void loadStatus()}
            disabled={loading}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-2">
        {loading && !status ? (
          <p className="py-6 text-sm text-zinc-500">Loading GoCardless status…</p>
        ) : null}

        {error ? (
          <p className="py-6 text-sm text-rose-600">{error}</p>
        ) : null}

        {status ? (
          <>
            <StatusRow
              label="Platform enabled"
              value={status.platformEnabled ? "Yes" : "No"}
              status={status.platformEnabled ? "ok" : "warn"}
            />
            <StatusRow
              label="Club connect"
              value={status.clubConnectAvailable ? "Available" : "Unavailable"}
              status={status.clubConnectAvailable ? "ok" : "warn"}
            />
            <StatusRow
              label="Platform fee"
              value={`${status.platformFeePercent}%`}
              status="neutral"
            />
            <StatusRow
              label="Connection status"
              value={status.connectionStatusLabel}
              status={
                status.connectionStatus === "live_connected" ||
                status.connectionStatus === "sandbox_connected"
                  ? "ok"
                  : status.connectionStatus === "error"
                    ? "warn"
                    : "warn"
              }
            />
            <StatusRow
              label="Environment"
              value={status.environment === "live" ? "Live" : "Sandbox"}
              status="neutral"
            />
            <StatusRow
              label="GOCARDLESS_CLIENT_ID"
              value={status.credentials.clientId === "set" ? "Set" : "Missing"}
              status={status.credentials.clientId === "set" ? "ok" : "warn"}
            />
            <StatusRow
              label="GOCARDLESS_CLIENT_SECRET"
              value={
                status.credentials.clientSecret === "set" ? "Set" : "Missing"
              }
              status={status.credentials.clientSecret === "set" ? "ok" : "warn"}
            />
            <StatusRow
              label="GOCARDLESS_REDIRECT_URI"
              value={
                status.credentials.redirectUri === "set" ? "Set" : "Missing"
              }
              status={status.credentials.redirectUri === "set" ? "ok" : "warn"}
              detail={status.callbackUrl}
            />
            <StatusRow
              label="GOCARDLESS_ACCESS_TOKEN"
              value={status.credentials.accessToken === "set" ? "Set" : "Missing"}
              status={status.credentials.accessToken === "set" ? "ok" : "warn"}
              detail="Used for Pro/Franchise subscription billing"
            />
            <StatusRow
              label="GOCARDLESS_WEBHOOK_SECRET"
              value={
                status.credentials.webhookSecret === "set" ? "Set" : "Missing"
              }
              status={status.credentials.webhookSecret === "set" ? "ok" : "warn"}
              detail={status.webhookUrl}
            />
            <StatusRow
              label="OAuth connect URL"
              value={status.connectBaseUrl.replace("https://", "")}
              status="neutral"
            />
            <StatusRow
              label="Connection test"
              value={
                status.connectionTest.status === "ready"
                  ? "Ready"
                  : status.connectionTest.status === "partial"
                    ? "Partial"
                    : "Not configured"
              }
              status={
                status.connectionTest.status === "ready"
                  ? "ok"
                  : status.connectionTest.status === "partial"
                    ? "warn"
                    : "warn"
              }
              detail={status.connectionTest.message}
            />
          </>
        ) : null}
      </div>
    </article>
  );
}
