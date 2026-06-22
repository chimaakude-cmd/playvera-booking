"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  buildMissingProviderPaymentStatusResponse,
  type ClubPaymentStatusApiResponse,
} from "@/lib/payments/club-payment-status";
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
    provider: payload.provider?.trim() || "GoCardless",
    paymentModel: payload.paymentModel?.trim() || "club_oauth",
    providerRecordMissing: Boolean(payload.providerRecordMissing),
    stripeOptional: payload.stripeOptional !== false,
    gocardlessAvailable: payload.gocardlessAvailable !== false,
    gocardlessConnected: Boolean(payload.gocardlessConnected),
    stripeConnected: Boolean(payload.stripeConnected),
    status: {
      status: payload.status.status ?? "setup_required",
      tone: safeTone,
      label: payload.status.label,
      reason:
        payload.status.reason?.trim() ||
        "Connect your GoCardless account to receive payouts directly.",
    },
    payoutSchedule: payload.payoutSchedule ?? "weekly",
    payoutScheduleLabel:
      payload.payoutScheduleLabel?.trim() || "Weekly",
    estimatedNextPayout:
      payload.estimatedNextPayout?.trim() || "After first booking",
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

      const normalized =
        normalizePaymentStatusResponse(
          payload as Partial<ClubPaymentStatusApiResponse>,
        ) ??
        normalizePaymentStatusResponse(
          buildMissingProviderPaymentStatusResponse(0),
        );

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
      description="Connect your GoCardless account to receive payouts directly."
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

          {data.gocardlessConnected ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <p className="font-semibold">Connected to GoCardless</p>
              <p className="mt-1">
                Payouts sent directly to your bank account
              </p>
            </div>
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
            {!data.gocardlessConnected ? (
              <Link
                href="/club/finance?tab=providers"
                className="inline-flex items-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
              >
                Connect GoCardless
              </Link>
            ) : null}
            <Link
              href="/club/finance?tab=payouts"
              className="inline-flex items-center rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
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
      <AvailabilityPill
        label={
          data.gocardlessConnected
            ? "GoCardless connected"
            : data.gocardlessAvailable
              ? "GoCardless — connect required"
              : "GoCardless pending setup"
        }
        tone={
          data.gocardlessConnected
            ? "green"
            : data.gocardlessAvailable
              ? "amber"
              : "amber"
        }
      />
      <AvailabilityPill
        label={
          data.stripeConnected ? "Stripe connected" : "Stripe optional"
        }
        tone={data.stripeConnected ? "green" : "slate"}
      />
      <AvailabilityPill
        label={`${data.platformFeePercent.toFixed(1)}% Activora fee`}
        tone="slate"
      />
    </ul>
  );
}

function AvailabilityPill({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "slate" | "amber";
}) {
  const styles = {
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
      <p className="font-semibold">
        Connect your GoCardless account to receive payouts directly
      </p>
      <p className="mt-2 text-amber-900">
        Use the Connect GoCardless button above to link your club account.
        Stripe card payments are optional if you want instant checkout.
      </p>
    </div>
  );
}
