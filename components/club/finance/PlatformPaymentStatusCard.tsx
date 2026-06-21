"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FinanceButton, FinanceSection } from "./shared";

type PaymentStatusResponse = {
  provider: string;
  paymentModel: string;
  status: {
    status: string;
    tone: "green" | "yellow" | "orange" | "red";
    label: string;
    reason: string;
  };
  payoutScheduleLabel: string;
  estimatedNextPayout: string;
  platformFeePercent: number;
};

const TONE_STYLES = {
  green: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  yellow: "bg-amber-50 text-amber-900 ring-amber-200",
  orange: "bg-orange-50 text-orange-900 ring-orange-200",
  red: "bg-rose-50 text-rose-800 ring-rose-200",
};

export function PlatformPaymentStatusCard() {
  const [data, setData] = useState<PaymentStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/club/payment-status");
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "Could not load payment status.");
      }

      setData((await response.json()) as PaymentStatusResponse);
    } catch (loadError) {
      setData(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load payment status.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <FinanceSection
      title="Payment provider"
      description="Activora manages Direct Debit payments on your behalf — no separate GoCardless account required."
      action={
        <FinanceButton variant="secondary" onClick={() => void load()}>
          Refresh
        </FinanceButton>
      }
    >
      {loading ? (
        <p className="text-sm text-zinc-500">Loading payment status…</p>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {data ? (
        <div className="space-y-5">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Provider
              </dt>
              <dd className="mt-1 text-sm font-semibold text-zinc-900">
                {data.provider}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Status
              </dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${TONE_STYLES[data.status.tone]}`}
                >
                  {data.status.label}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Payout schedule
              </dt>
              <dd className="mt-1 text-sm font-medium text-zinc-900">
                {data.payoutScheduleLabel}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Estimated next payout
              </dt>
              <dd className="mt-1 text-sm font-medium text-zinc-900">
                {data.estimatedNextPayout}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Platform fee
              </dt>
              <dd className="mt-1 text-sm font-medium text-zinc-900">
                {data.platformFeePercent.toFixed(1)}%
              </dd>
            </div>
          </dl>

          <p className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            {data.status.reason}
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/club/finance?tab=payouts"
              className="inline-flex items-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
            >
              View payout history
            </Link>
            <a
              href="mailto:support@activora.uk?subject=Payment%20support%20request"
              className="inline-flex items-center rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Contact Activora support
            </a>
          </div>
        </div>
      ) : null}
    </FinanceSection>
  );
}
