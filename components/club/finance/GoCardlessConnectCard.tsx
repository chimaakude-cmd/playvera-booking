"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  calculateGoCardlessPayoutBreakdown,
  completeMockGoCardlessOnboarding,
  disconnectGoCardless,
  getGoCardlessConnection,
  startGoCardlessOnboarding,
  testGoCardlessConnection,
  type GoCardlessConnection,
  type GoCardlessConnectionStatus,
} from "@/lib/gocardless";
import {
  PAYMENT_PROVIDER_DEFINITIONS,
  getGoCardlessConnectionLabel,
} from "@/lib/payment-providers/config";
import { PLATFORM_FEE_PERCENT, formatMoney } from "@/lib/payments";
import { FinanceButton } from "./shared";

const SAMPLE_PAYMENT = 50;
const GOCARDLESS = PAYMENT_PROVIDER_DEFINITIONS.gocardless;

function StatusBadge({ status }: { status: GoCardlessConnectionStatus }) {
  const label = getGoCardlessConnectionLabel(status);
  const styles: Record<string, string> = {
    "Not connected": "bg-zinc-100 text-zinc-600 ring-zinc-200",
    "Action required": "bg-amber-50 text-amber-800 ring-amber-200",
    Connected: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${styles[label] ?? styles["Not connected"]}`}
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
      setMessage("GoCardless connected successfully (placeholder flow).");
    }
  }, [searchParams]);

  async function handleConnect() {
    setActionLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { url } = await startGoCardlessOnboarding();
      window.location.assign(url);
    } catch (connectError) {
      setError(
        connectError instanceof Error
          ? connectError.message
          : "Could not start GoCardless connect.",
      );
      setActionLoading(false);
    }
  }

  async function handleManage() {
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
          : "Connection check failed.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRefreshStatus() {
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
          : "Could not refresh GoCardless status.",
      );
    } finally {
      setActionLoading(false);
    }
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
  const isConnected = status === "connected";
  const needsSetup =
    status === "pending_setup" || status === "action_required";

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-5">
      {message ? (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
            style={{ backgroundColor: GOCARDLESS.brandColor }}
          >
            {GOCARDLESS.brandInitial}
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900">{GOCARDLESS.name}</h3>
            <p className="text-xs text-zinc-500">{GOCARDLESS.paymentType}</p>
            <p className="mt-0.5 text-xs text-zinc-600">{GOCARDLESS.tagline}</p>
            {loading ? (
              <p className="mt-1 text-sm text-zinc-500">Loading status…</p>
            ) : (
              <div className="mt-1">
                <StatusBadge status={status} />
              </div>
            )}
          </div>
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

          {isConnected || needsSetup ? (
            <FinanceButton
              variant="secondary"
              onClick={() => void handleManage()}
              disabled={actionLoading}
            >
              Manage GoCardless
            </FinanceButton>
          ) : null}

          {status !== "not_connected" && status !== "disconnected" ? (
            <FinanceButton
              variant="secondary"
              onClick={() => void handleRefreshStatus()}
              disabled={actionLoading}
            >
              Refresh status
            </FinanceButton>
          ) : null}

          {status !== "not_connected" && status !== "disconnected" ? (
            <FinanceButton
              variant="danger"
              onClick={() => void handleDisconnect()}
              disabled={actionLoading}
            >
              Disconnect
            </FinanceButton>
          ) : null}
        </div>
      </div>

      <p className="mt-3 text-sm text-zinc-600">{GOCARDLESS.description}</p>

      {connection?.merchant_id ? (
        <p className="mt-2 font-mono text-xs text-zinc-500">
          Merchant ID: {connection.merchant_id}
        </p>
      ) : null}

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Best for
        </p>
        <ul className="mt-2 list-inside list-disc text-sm text-zinc-600">
          {GOCARDLESS.bestFor.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      {GOCARDLESS.supportedUseCases?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {GOCARDLESS.supportedUseCases.map((useCase) => (
            <span
              key={useCase}
              className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600"
            >
              {useCase}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 max-w-lg rounded-xl border border-zinc-100 bg-white p-4 text-sm">
        <p className="font-medium text-zinc-900">
          Fee breakdown (example £{SAMPLE_PAYMENT} payment)
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
          Activora platform fee is {PLATFORM_FEE_PERCENT}% on all payment methods.
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
