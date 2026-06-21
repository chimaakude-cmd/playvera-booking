"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { ClubPaymentStatusApiResponse } from "@/lib/payments/club-payment-status";
import { FinanceButton, FinanceSection } from "./shared";

const TONE_STYLES = {
  green: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  yellow: "bg-amber-50 text-amber-900 ring-amber-200",
  orange: "bg-orange-50 text-orange-900 ring-orange-200",
  red: "bg-rose-50 text-rose-800 ring-rose-200",
} as const;

function normalizePaymentStatusResponse(
  payload: Partial<ClubPaymentStatusApiResponse> | null | undefined,
): ClubPaymentStatusApiResponse | null {
  if (!payload?.status?.label || !payload.status.tone) {
    return null;
  }

  const platformFeePercent = Number(payload.platformFeePercent);
  const tone = payload.status.tone;
  const safeTone = tone in TONE_STYLES ? tone : "yellow";

  return {
    provider: payload.provider?.trim() || "Activora (GoCardless)",
    paymentModel: payload.paymentModel?.trim() || "platform_managed",
    providerRecordMissing: Boolean(payload.providerRecordMissing),
    stripeOptional: payload.stripeOptional !== false,
    gocardlessAvailable: payload.gocardlessAvailable !== false,
    status: {
      status: payload.status.status ?? "awaiting_first_payment",
      tone: safeTone,
      label: payload.status.label,
      reason:
        payload.status.reason?.trim() ||
        "Payments are managed by Activora. GoCardless Direct Debit is available; Stripe card payments are optional.",
    },
    payoutSchedule: payload.payoutSchedule ?? "weekly",
    payoutScheduleLabel:
      payload.payoutScheduleLabel?.trim() || "Weekly",
    estimatedNextPayout:
      payload.estimatedNextPayout?.trim() || "Pending first payment",
    platformFeePercent: Number.isFinite(platformFeePercent)
      ? platformFeePercent
      : 0,
  };
}

export function PlatformPaymentStatusCard() {
  const [data, setData] = useState<ClubPaymentStatusApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/club/payment-status");
      const payload = (await response.json().catch(() => null)) as
        | Partial<ClubPaymentStatusApiResponse>
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          (payload && "error" in payload && payload.error) ||
            "Could not load payment status.",
        );
      }

      const normalized = normalizePaymentStatusResponse(
        payload as Partial<ClubPaymentStatusApiResponse>,
      );

      if (!normalized) {
        throw new Error("Could not load payment status.");
      }

      setData(normalized);
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

  const statusTone = data?.status.tone ?? "yellow";
  const toneClass =
    TONE_STYLES[statusTone in TONE_STYLES ? statusTone : "yellow"];

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
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
          <MissingProviderFallback />
        </div>
      ) : null}

      {data ? (
        <div className="space-y-5">
          {data.providerRecordMissing ? (
            <MissingProviderFallback />
          ) : null}

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
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${toneClass}`}
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

          <ProviderAvailabilitySummary data={data} />

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

function ProviderAvailabilitySummary({
  data,
}: {
  data: ClubPaymentStatusApiResponse;
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      <AvailabilityPill label="Payments are managed by Activora" tone="teal" />
      <AvailabilityPill
        label={data.gocardlessAvailable ? "GoCardless available" : "GoCardless pending setup"}
        tone={data.gocardlessAvailable ? "green" : "amber"}
      />
      <AvailabilityPill
        label={data.stripeOptional ? "Stripe optional" : "Stripe unavailable"}
        tone={data.stripeOptional ? "slate" : "amber"}
      />
    </ul>
  );
}

function AvailabilityPill({
  label,
  tone,
}: {
  label: string;
  tone: "teal" | "green" | "slate" | "amber";
}) {
  const styles = {
    teal: "border-teal-200 bg-teal-50 text-teal-900",
    green: "border-emerald-200 bg-emerald-50 text-emerald-900",
    slate: "border-zinc-200 bg-zinc-50 text-zinc-800",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
  };

  return (
    <li
      className={`rounded-xl border px-4 py-3 text-sm font-medium ${styles[tone]}`}
    >
      {label}
    </li>
  );
}

function MissingProviderFallback() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
      <p className="font-semibold">Payments are managed by Activora</p>
      <p className="mt-2 text-amber-900">
        GoCardless Direct Debit is available through Activora. Stripe card
        payments are optional if you want instant checkout.
      </p>
      <p className="mt-2 text-amber-900">
        Your club account is still syncing payment settings. You can continue
        using the club dashboard safely while Activora completes setup.
      </p>
    </div>
  );
}
