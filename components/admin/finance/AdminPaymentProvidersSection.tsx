"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminPaymentProviderRow } from "@/lib/admin/payment-providers-data";
import {
  isProviderGoCardlessConnected,
  isProviderStripeConnected,
} from "@/lib/admin/payment-providers-data";
import {
  GOCARDLESS_STATUS_LABELS,
  type GoCardlessConnectionStatus,
} from "@/lib/gocardless/types";
import {
  STRIPE_CONNECT_STATUS_LABELS,
  type StripeConnectStatus,
} from "@/lib/stripe-connect/types";

type ProviderRow = AdminPaymentProviderRow;

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "ok" | "warn" | "neutral" | "error";
}) {
  const styles = {
    ok: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    neutral: "bg-zinc-100 text-zinc-600 ring-zinc-200",
    error: "bg-rose-50 text-rose-700 ring-rose-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[tone]}`}
    >
      {label}
    </span>
  );
}

export function AdminPaymentProvidersSection() {
  const [rows, setRows] = useState<ProviderRow[]>([]);
  const [dataSource, setDataSource] = useState<"supabase" | "unavailable" | "loading">(
    "loading",
  );

  const load = useCallback(async () => {
    setDataSource("loading");

    try {
      const response = await fetch("/api/admin/payment-providers");
      if (!response.ok) {
        setRows([]);
        setDataSource("unavailable");
        return;
      }

      const result = (await response.json()) as {
        providers: ProviderRow[];
        dataSource: "supabase" | "unavailable";
      };

      setRows(result.providers);
      setDataSource(result.dataSource);
    } catch {
      setRows([]);
      setDataSource("unavailable");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stripeProviders = rows.filter((row) =>
    isProviderStripeConnected(row.stripeStatus),
  );
  const gocardlessProviders = rows.filter((row) =>
    isProviderGoCardlessConnected(row.gocardlessStatus),
  );
  const failedProviders = rows.filter((row) => row.hasFailedPayments);
  const setupNeeded = rows.filter((row) => row.needsSetup);
  const hasAnyConnection =
    stripeProviders.length > 0 ||
    gocardlessProviders.length > 0 ||
    setupNeeded.length > 0 ||
    failedProviders.length > 0;

  return (
    <div className="space-y-6">
      <article className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              Payment providers
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Platform-wide Stripe and GoCardless connection status by provider.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {dataSource === "supabase" ? (
              <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">
                Live data
              </span>
            ) : null}
            {dataSource === "unavailable" ? (
              <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
                Supabase not connected
              </span>
            ) : null}
          </div>
        </div>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Stripe connected" value={stripeProviders.length} />
          <SummaryCard
            label="GoCardless connected"
            value={gocardlessProviders.length}
          />
          <SummaryCard
            label="Needs setup"
            value={setupNeeded.length}
            accent="amber"
          />
          <SummaryCard
            label="Failed payments"
            value={failedProviders.length}
            accent="rose"
          />
        </div>
        {dataSource !== "loading" && !hasAnyConnection ? (
          <p className="border-t border-zinc-100 px-6 py-6 text-sm text-zinc-500">
            No payment providers connected yet.
          </p>
        ) : null}
      </article>

      <ProviderTable
        title="Stripe providers"
        description="Clubs with Stripe Connect accounts."
        rows={stripeProviders}
        emptyMessage="No Stripe-connected providers yet."
        showStripe
      />

      <ProviderTable
        title="GoCardless providers"
        description="Clubs using Direct Debit backup."
        rows={gocardlessProviders}
        emptyMessage="No GoCardless-connected providers yet."
        showGocardless
      />

      <ProviderTable
        title="Providers needing setup"
        description="Incomplete Stripe or GoCardless onboarding."
        rows={setupNeeded}
        emptyMessage="No providers need payment setup."
        showStripe
        showGocardless
      />

      <ProviderTable
        title="Failed payment providers"
        description="Providers with recent payment failures."
        rows={failedProviders}
        emptyMessage="No providers with failed payments."
        showStripe
        showGocardless
        showFailed
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "amber" | "rose";
}) {
  const accentClass =
    accent === "amber"
      ? "text-amber-700"
      : accent === "rose"
        ? "text-rose-700"
        : "text-teal-700";

  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 px-4 py-3">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accentClass}`}>{value}</p>
    </div>
  );
}

function ProviderTable({
  title,
  description,
  rows,
  emptyMessage,
  showStripe = false,
  showGocardless = false,
  showFailed = false,
}: {
  title: string;
  description: string;
  rows: ProviderRow[];
  emptyMessage: string;
  showStripe?: boolean;
  showGocardless?: boolean;
  showFailed?: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-6 py-5">
        <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      </div>
      {rows.length === 0 ? (
        <p className="px-6 py-8 text-sm text-zinc-500">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-100">
            <thead>
              <tr className="bg-zinc-50/80">
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Provider
                </th>
                {showStripe ? (
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Stripe
                  </th>
                ) : null}
                {showGocardless ? (
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    GoCardless
                  </th>
                ) : null}
                {showFailed ? (
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Failed
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.map((row) => (
                <tr key={row.providerId} className="hover:bg-zinc-50/50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-zinc-900">
                    {row.clubName}
                    <span className="mt-0.5 block font-mono text-xs text-zinc-400">
                      {row.providerId}
                    </span>
                  </td>
                  {showStripe ? (
                    <td className="whitespace-nowrap px-6 py-4">
                      {isProviderStripeConnected(row.stripeStatus) ? (
                        <StatusPill
                          label={
                            STRIPE_CONNECT_STATUS_LABELS[
                              row.stripeStatus as StripeConnectStatus
                            ]
                          }
                          tone={
                            row.stripeStatus === "connected" ||
                            row.stripeStatus === "payouts_enabled"
                              ? "ok"
                              : row.stripeStatus === "action_required"
                                ? "warn"
                                : "neutral"
                          }
                        />
                      ) : (
                        <span className="text-sm text-zinc-400">—</span>
                      )}
                    </td>
                  ) : null}
                  {showGocardless ? (
                    <td className="whitespace-nowrap px-6 py-4">
                      {isProviderGoCardlessConnected(row.gocardlessStatus) ? (
                        <StatusPill
                          label={
                            GOCARDLESS_STATUS_LABELS[
                              row.gocardlessStatus as GoCardlessConnectionStatus
                            ]
                          }
                          tone="ok"
                        />
                      ) : (
                        <span className="text-sm text-zinc-400">—</span>
                      )}
                    </td>
                  ) : null}
                  {showFailed ? (
                    <td className="whitespace-nowrap px-6 py-4">
                      <StatusPill
                        label={row.hasFailedPayments ? "Yes" : "No"}
                        tone={row.hasFailedPayments ? "error" : "ok"}
                      />
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}
