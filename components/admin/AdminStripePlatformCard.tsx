"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminStripePlatformStatus } from "@/app/api/admin/stripe-platform-status/route";

type StatusRowProps = {
  label: string;
  value: string;
  status: "ok" | "warn" | "neutral";
  detail?: string;
};

function StatusBadge({ status, children }: { status: StatusRowProps["status"]; children: React.ReactNode }) {
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
        {detail ? <p className="mt-0.5 text-xs text-zinc-500">{detail}</p> : null}
      </div>
      <StatusBadge status={status}>{value}</StatusBadge>
    </div>
  );
}

export function AdminStripePlatformCard() {
  const [status, setStatus] = useState<AdminStripePlatformStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/stripe-platform-status");
      if (!response.ok) {
        throw new Error("Unable to load Stripe platform status.");
      }
      const data = (await response.json()) as AdminStripePlatformStatus;
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
              Stripe Platform Setup
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Environment status only — secret keys are never displayed.
            </p>
          </div>
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

      <div className="px-6 py-2">
        {loading && !status ? (
          <p className="py-6 text-sm text-zinc-500">Loading Stripe status…</p>
        ) : null}

        {error ? (
          <p className="py-6 text-sm text-rose-600">{error}</p>
        ) : null}

        {status ? (
          <>
            <StatusRow
              label="STRIPE_SECRET_KEY"
              value={status.secretKey.status === "set" ? "Set" : "Missing"}
              status={status.secretKey.status === "set" ? "ok" : "warn"}
              detail={
                status.secretKey.mode
                  ? `${status.secretKey.mode === "test" ? "Test" : "Live"} mode · ${status.secretKey.prefix ?? "prefix hidden"}`
                  : undefined
              }
            />
            <StatusRow
              label="NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
              value={
                status.publishableKey.status === "set" ? "Set" : "Missing"
              }
              status={status.publishableKey.status === "set" ? "ok" : "warn"}
              detail={
                status.publishableKey.mode
                  ? `${status.publishableKey.mode === "test" ? "Test" : "Live"} mode · ${status.publishableKey.prefix ?? "prefix hidden"}`
                  : status.publishableKey.prefix ?? undefined
              }
            />
            <StatusRow
              label="STRIPE_WEBHOOK_SECRET"
              value={status.webhook.status === "set" ? "Set" : "Missing"}
              status={status.webhook.status === "set" ? "ok" : "warn"}
            />
            <StatusRow
              label="Stripe Connect"
              value={
                status.connect.status === "enabled"
                  ? "Enabled"
                  : status.connect.status === "disabled"
                    ? "Not enabled"
                    : "Unknown"
              }
              status={
                status.connect.ready
                  ? "ok"
                  : status.connect.status === "disabled"
                    ? "warn"
                    : "neutral"
              }
              detail={
                status.connect.ready
                  ? "Platform ready for Express onboarding"
                  : "Enable Connect in Stripe Dashboard"
              }
            />
            <StatusRow
              label="Platform country"
              value={status.platform.country}
              status="neutral"
            />
            <StatusRow
              label="Connect account type"
              value={status.platform.accountType === "express" ? "Express" : status.platform.accountType}
              status="neutral"
            />
          </>
        ) : null}
      </div>
    </article>
  );
}
