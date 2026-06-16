"use client";

import { useCallback, useEffect, useState } from "react";
import { getStripeConnectState } from "@/lib/stripe-connect/storage";
import { getGoCardlessConnection } from "@/lib/gocardless/storage";
import {
  GOCARDLESS_STATUS_LABELS,
  type GoCardlessConnectionStatus,
} from "@/lib/gocardless/types";
import {
  STRIPE_CONNECT_STATUS_LABELS,
  type StripeConnectStatus,
} from "@/lib/stripe-connect/types";

type ProviderRow = {
  providerId: string;
  clubName: string;
  stripeStatus: StripeConnectStatus;
  gocardlessStatus: GoCardlessConnectionStatus;
  needsSetup: boolean;
  hasFailedPayments: boolean;
};

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

  const load = useCallback(() => {
    const stripe = getStripeConnectState();
    const gocardless = getGoCardlessConnection();

    const demoRow: ProviderRow = {
      providerId: stripe.providerId,
      clubName: "Demo Activora Club",
      stripeStatus: stripe.status,
      gocardlessStatus: gocardless.status,
      needsSetup:
        stripe.status === "not_connected" ||
        stripe.status === "action_required" ||
        gocardless.status === "pending_setup",
      hasFailedPayments: false,
    };

  const mockRows: ProviderRow[] = [
    demoRow,
    {
      providerId: "provider-2",
      clubName: "Northside Juniors FC",
      stripeStatus: "connected",
      gocardlessStatus: "not_connected",
      needsSetup: false,
      hasFailedPayments: true,
    },
    {
      providerId: "provider-3",
      clubName: "Riverside Dance Academy",
      stripeStatus: "action_required",
      gocardlessStatus: "connected",
      needsSetup: true,
      hasFailedPayments: false,
    },
  ];

    setRows(mockRows);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stripeProviders = rows.filter(
    (r) => r.stripeStatus !== "not_connected",
  );
  const gocardlessProviders = rows.filter(
    (r) => r.gocardlessStatus === "connected",
  );
  const failedProviders = rows.filter((r) => r.hasFailedPayments);
  const setupNeeded = rows.filter((r) => r.needsSetup);

  return (
    <div className="space-y-6">
      <article className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-5">
          <h2 className="text-lg font-semibold text-zinc-900">
            Payment providers
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Platform-wide Stripe and GoCardless connection status by provider.
          </p>
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
      </article>

      <ProviderTable
        title="Stripe providers"
        description="Clubs with Stripe Connect accounts."
        rows={stripeProviders}
        showStripe
      />

      <ProviderTable
        title="GoCardless providers"
        description="Clubs using Direct Debit backup."
        rows={gocardlessProviders}
        showGocardless
      />

      <ProviderTable
        title="Providers needing setup"
        description="Incomplete Stripe or GoCardless onboarding."
        rows={setupNeeded}
        showStripe
        showGocardless
      />

      <ProviderTable
        title="Failed payment providers"
        description="Providers with recent payment failures."
        rows={failedProviders}
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
  showStripe = false,
  showGocardless = false,
  showFailed = false,
}: {
  title: string;
  description: string;
  rows: ProviderRow[];
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
        <p className="px-6 py-8 text-sm text-zinc-500">No providers in this list.</p>
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
                      <StatusPill
                        label={STRIPE_CONNECT_STATUS_LABELS[row.stripeStatus]}
                        tone={
                          row.stripeStatus === "connected" ||
                          row.stripeStatus === "payouts_enabled"
                            ? "ok"
                            : row.stripeStatus === "action_required"
                              ? "warn"
                              : "neutral"
                        }
                      />
                    </td>
                  ) : null}
                  {showGocardless ? (
                    <td className="whitespace-nowrap px-6 py-4">
                      <StatusPill
                        label={
                          GOCARDLESS_STATUS_LABELS[row.gocardlessStatus]
                        }
                        tone={
                          row.gocardlessStatus === "connected"
                            ? "ok"
                            : "neutral"
                        }
                      />
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
