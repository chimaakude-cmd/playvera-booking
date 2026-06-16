"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  calculateGoCardlessPayoutBreakdown,
  GOCARDLESS_STATUS_LABELS,
  completeMockGoCardlessOnboarding,
  disconnectGoCardless,
  getGoCardlessConnection,
  startGoCardlessOnboarding,
  testGoCardlessConnection,
  type GoCardlessConnection,
  type GoCardlessConnectionStatus,
} from "@/lib/gocardless";
import { PLATFORM_FEE_PERCENT, formatMoney } from "@/lib/payments";
import { FinanceButton } from "./shared";

const SAMPLE_PAYMENT = 50;

function StatusBadge({
  status,
  variant,
}: {
  status: GoCardlessConnectionStatus;
  variant?: "backup" | "default";
}) {
  const styles: Record<GoCardlessConnectionStatus, string> = {
    not_connected: "bg-zinc-100 text-zinc-600 ring-zinc-200",
    pending_setup: "bg-amber-50 text-amber-800 ring-amber-200",
    connected: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    action_required: "bg-rose-50 text-rose-700 ring-rose-200",
    disconnected: "bg-zinc-100 text-zinc-500 ring-zinc-200",
  };

  const label =
    variant === "backup" && status === "not_connected"
      ? "Available backup"
      : GOCARDLESS_STATUS_LABELS[status];

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      {label}
    </span>
  );
}

export function GoCardlessConnectCard() {
  const searchParams = useSearchParams();
  const [connection, setConnection] = useState<GoCardlessConnection | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setConnection(getGoCardlessConnection());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const connected = searchParams.get("gocardless");
    if (connected === "connected") {
      const next = completeMockGoCardlessOnboarding();
      setConnection(next);
      setMessage("GoCardless connected successfully (mock OAuth flow).");
    }
  }, [searchParams]);

  async function handleConnect() {
    setActionLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { url, mock } = await startGoCardlessOnboarding();
      if (mock) {
        window.location.assign(url);
      } else {
        window.location.assign(url);
      }
    } catch (connectError) {
      setError(
        connectError instanceof Error
          ? connectError.message
          : "Could not start GoCardless connect.",
      );
      setActionLoading(false);
    }
  }

  async function handleTest() {
    setActionLoading(true);
    setError(null);
    setMessage(null);

    try {
      const result = await testGoCardlessConnection();
      if (result.ok) {
        setMessage(result.message);
        refresh();
      } else {
        setError(result.message);
      }
    } catch (testError) {
      setError(
        testError instanceof Error
          ? testError.message
          : "Connection test failed.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  function handleViewStatus() {
    const current = getGoCardlessConnection();
    const lines = [
      `Status: ${GOCARDLESS_STATUS_LABELS[current.status]}`,
      current.organisation_id
        ? `Organisation: ${current.organisation_id}`
        : "Organisation: not set",
      current.merchant_id
        ? `Merchant: ${current.merchant_id}`
        : "Merchant: not set",
      `Updated: ${new Date(current.updated_at).toLocaleString("en-GB")}`,
    ];
    window.alert(lines.join("\n"));
  }

  async function handleDisconnect() {
    if (
      !window.confirm(
        "Disconnect GoCardless? Direct Debit payments will be disabled.",
      )
    ) {
      return;
    }

    setActionLoading(true);
    setError(null);

    const next = disconnectGoCardless();
    setConnection(next);
    setMessage("GoCardless disconnected.");
    setActionLoading(false);
  }

  const status = connection?.status ?? "not_connected";
  const breakdown = calculateGoCardlessPayoutBreakdown(SAMPLE_PAYMENT);

  return (
    <div className="space-y-4">
      {message ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50/60 p-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1B2A4E] text-lg font-bold text-white">
              GC
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900">GoCardless</h3>
              <p className="text-xs text-zinc-500">
                Direct Debit · United Kingdom · Backup provider
              </p>
              {loading ? (
                <p className="mt-1 text-sm text-zinc-500">Loading status…</p>
              ) : (
                <div className="mt-1">
                  <StatusBadge status={status} variant="backup" />
                </div>
              )}
            </div>
          </div>

          <p className="mt-3 text-sm text-zinc-600">
            Use GoCardless if your club prefers Direct Debit or cannot use Stripe.
          </p>

          {connection?.merchant_id ? (
            <p className="mt-2 font-mono text-xs text-zinc-500">
              Merchant ID: {connection.merchant_id}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {status === "not_connected" || status === "disconnected" ? (
            <FinanceButton
              onClick={() => void handleConnect()}
              disabled={actionLoading}
            >
              Connect GoCardless
            </FinanceButton>
          ) : null}

          {status !== "not_connected" ? (
            <>
              <FinanceButton
                variant="secondary"
                onClick={handleViewStatus}
                disabled={actionLoading}
              >
                View setup status
              </FinanceButton>
              <FinanceButton
                variant="secondary"
                onClick={() => void handleTest()}
                disabled={actionLoading}
              >
                Test connection
              </FinanceButton>
              <FinanceButton
                variant="danger"
                onClick={() => void handleDisconnect()}
                disabled={actionLoading}
              >
                Disconnect
              </FinanceButton>
            </>
          ) : null}
        </div>
      </div>

      <div className="max-w-lg rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm">
        <p className="font-medium text-zinc-900">Direct Debit payment breakdown</p>
        <p className="mt-1 text-xs text-zinc-500">
          Example for a £{SAMPLE_PAYMENT} customer payment.
        </p>
        <dl className="mt-3 space-y-2">
          <BreakdownRow label="Customer payment" value={breakdown.customerPayment} />
          <BreakdownRow
            label="GoCardless processing fee"
            value={breakdown.gocardlessProcessingFee}
            negative
          />
          <BreakdownRow
            label={`Activora fee (${breakdown.platformFeePercent}%)`}
            value={breakdown.activoraPlatformFee}
            negative
          />
        </dl>
        <div className="my-2 border-t border-dashed border-zinc-300" />
        <BreakdownRow
          label="Provider payout"
          value={breakdown.providerPayout}
          emphasis
        />
        <p className="mt-3 text-xs text-zinc-500">
          Stripe remains the primary provider. Activora platform fee is{" "}
          {PLATFORM_FEE_PERCENT}% on all payment methods.
        </p>
      </div>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  negative = false,
  emphasis = false,
}: {
  label: string;
  value: number;
  negative?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className={emphasis ? "font-semibold text-zinc-900" : "text-zinc-500"}>
        {label}
      </dt>
      <dd
        className={`font-medium ${
          emphasis
            ? "font-semibold text-zinc-900"
            : negative
              ? "text-zinc-600"
              : "text-zinc-900"
        }`}
      >
        {negative ? "−" : ""}
        {formatMoney(value)}
      </dd>
    </div>
  );
}
