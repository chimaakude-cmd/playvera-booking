"use client";

import { useCallback, useEffect, useState } from "react";
import type { GoCardlessPlatformConfigPublic } from "@/lib/gocardless/platform-config/types";

type ConfigResponse = {
  config: GoCardlessPlatformConfigPublic;
};

function formatTimestamp(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AdminPaymentModeBanner() {
  const [config, setConfig] = useState<GoCardlessPlatformConfigPublic | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/gocardless-platform-config");
      if (response.ok) {
        const body = (await response.json()) as ConfigResponse;
        setConfig(body.config);
      }
    } catch {
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return null;
  }

  if (!config) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
        GoCardless platform configuration could not be loaded.
      </div>
    );
  }

  const isLive =
    config.environment === "live" &&
    config.connectionStatus === "live_connected" &&
    config.platformEnabled;

  const bannerTone = isLive
    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
    : "border-amber-200 bg-amber-50 text-amber-900";

  const headline = isLive
    ? "Payments are live"
    : "Payments in test mode";

  const lastWebhook = config.lastWebhookReceivedAt;

  return (
    <div className={`rounded-2xl border px-5 py-4 ${bannerTone}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">{headline}</p>
          <p className="mt-1 text-xs opacity-90">
            {isLive
              ? "Parent booking payments are processed on the live GoCardless platform."
              : "Sandbox mode — use test bank details for booking payments."}
          </p>
        </div>
        <dl className="grid gap-x-6 gap-y-1 text-xs sm:grid-cols-3">
          <div>
            <dt className="font-medium opacity-75">Environment</dt>
            <dd className="font-semibold capitalize">{config.environment}</dd>
          </div>
          <div>
            <dt className="font-medium opacity-75">Last successful connection</dt>
            <dd className="font-semibold">{formatTimestamp(config.lastTestedAt)}</dd>
          </div>
          <div>
            <dt className="font-medium opacity-75">Last webhook received</dt>
            <dd className="font-semibold">{formatTimestamp(lastWebhook)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
