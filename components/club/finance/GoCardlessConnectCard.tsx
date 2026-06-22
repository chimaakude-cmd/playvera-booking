"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { GoCardlessConnectConfigResponse } from "@/app/api/gocardless/connect/config/route";
import { calculateGoCardlessPayoutBreakdown } from "@/lib/gocardless/fees";
import {
  completeMockGoCardlessOnboarding,
  disconnectGoCardlessRemote,
  fetchGoCardlessConnection,
  resolveGoCardlessProviderId,
  startGoCardlessOnboarding,
  testGoCardlessConnection,
} from "@/lib/gocardless/storage";
import {
  isGoCardlessConnected,
  type GoCardlessConnection,
  type GoCardlessConnectionStatus,
} from "@/lib/gocardless/types";
import { updateEnabledMethod } from "@/lib/payment-providers/storage";
import {
  PAYMENT_PROVIDER_DEFINITIONS,
  getGoCardlessConnectionLabel,
} from "@/lib/payment-providers/config";
import { PLATFORM_FEE_PERCENT, formatMoney } from "@/lib/payments";
import { getClubProfile } from "@/lib/club-profile";
import { FinanceButton } from "./shared";

const SAMPLE_PAYMENT = 50;
const GOCARDLESS = PAYMENT_PROVIDER_DEFINITIONS.gocardless;
const NOT_CONFIGURED_MESSAGE =
  "GoCardless unavailable. Activora is still configuring Direct Debit.";

function resolveOAuthErrorMessage(reason: string | null): string {
  switch (reason) {
    case "not_configured":
      return "GoCardless club connect is not available yet. Activora is still finishing platform setup.";
    case "invalid_state":
      return "GoCardless connection expired. Please try Connect GoCardless again.";
    case "missing_code":
      return "GoCardless did not return an authorization code. Please try again.";
    case "callback_failed":
      return "GoCardless connection could not be completed. Check your account and try again.";
    default:
      return "GoCardless connection could not be completed. Please try again.";
  }
}

type GoCardlessConnectCardProps = {
  paymentModel?: "platform_managed" | "club_oauth";
};

function safeClubProfileSummary(): { clubName: string; email: string } {
  try {
    const profile = getClubProfile();
    return {
      clubName: profile.clubName?.trim() ?? "",
      email: profile.contact?.email?.trim() ?? "",
    };
  } catch {
    return { clubName: "", email: "" };
  }
}

function formatConnectedDate(iso: string | null | undefined): string | null {
  if (!iso?.trim()) {
    return null;
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function resolveMandateStatus(
  status: GoCardlessConnectionStatus,
  platformManaged: boolean,
): string {
  if (platformManaged) {
    return "Platform mandates active";
  }

  if (status === "connected") {
    return "Mandates active";
  }

  if (status === "pending_setup") {
    return "Mandate setup in progress";
  }

  if (status === "action_required") {
    return "Mandate action required";
  }

  return "No mandate configured";
}

function StatusBadge({
  status,
  platformUnavailable,
}: {
  status: GoCardlessConnectionStatus;
  platformUnavailable: boolean;
}) {
  const label = platformUnavailable
    ? "Not available"
    : getGoCardlessConnectionLabel(status);
  const styles: Record<string, string> = {
    "Not available": "bg-zinc-100 text-zinc-500 ring-zinc-200",
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

export function GoCardlessConnectCard({
  paymentModel = "platform_managed",
}: GoCardlessConnectCardProps) {
  const searchParams = useSearchParams();
  const [connection, setConnection] = useState<GoCardlessConnection | null>(
    null,
  );
  const [platformConfig, setPlatformConfig] =
    useState<GoCardlessConnectConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const isDev = process.env.NODE_ENV !== "production";

  useEffect(() => {
    resolveGoCardlessProviderId();
  }, []);

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch("/api/gocardless/connect/config");
        if (response.ok) {
          setPlatformConfig(
            (await response.json()) as GoCardlessConnectConfigResponse,
          );
        } else {
          setPlatformConfig(null);
        }
      } catch {
        setPlatformConfig(null);
      }
    }

    void loadConfig();
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const next = await fetchGoCardlessConnection();
      setConnection(next);
    } catch (refreshError) {
      setConnection(null);
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Could not refresh GoCardless status.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const connected = searchParams.get("gocardless");
    const mock = searchParams.get("mock") === "1";
    const oauthError = searchParams.get("gocardless") === "error";

    if (oauthError) {
      setError(
        resolveOAuthErrorMessage(searchParams.get("reason")),
      );
      void refresh();
      return;
    }

    if (connected === "connected") {
      if (mock && isDev) {
        const next = completeMockGoCardlessOnboarding();
        if (next) {
          setConnection(next);
          updateEnabledMethod("gocardless_direct_debit", true);
          setMessage("GoCardless connected (development mock).");
        }
      } else {
        void refresh().then(() => {
          updateEnabledMethod("gocardless_direct_debit", true);
        });
        setMessage("GoCardless connected successfully.");
      }
    }
  }, [searchParams, refresh, isDev]);

  const platformConfigured = platformConfig?.platformConfigured ?? false;
  const platformUnavailable = platformConfig?.platformUnavailable ?? true;
  const configLoaded = platformConfig !== null;
  const platformManaged = paymentModel === "platform_managed";
  const clubProfile = safeClubProfileSummary();

  async function handleConnect() {
    if (!platformConfigured) {
      setError(NOT_CONFIGURED_MESSAGE);
      return;
    }

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
        await refresh();
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
    await handleManage();
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

    try {
      const next = await disconnectGoCardlessRemote();
      setConnection(next);
      setMessage("GoCardless disconnected.");
    } catch (disconnectError) {
      setError(
        disconnectError instanceof Error
          ? disconnectError.message
          : "Could not disconnect GoCardless.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  const status = connection?.status ?? "not_connected";
  const breakdown = calculateGoCardlessPayoutBreakdown(SAMPLE_PAYMENT);
  const connected = platformManaged
    ? platformConfigured && !platformUnavailable
    : isGoCardlessConnected(status, connection?.merchant_id);
  const needsSetup =
    !platformManaged &&
    (status === "pending_setup" || status === "action_required");
  const connectedDate = formatConnectedDate(connection?.connected_at);
  const mandateStatus = resolveMandateStatus(status, platformManaged);
  const displayStatus: GoCardlessConnectionStatus = platformManaged
    ? connected
      ? "connected"
      : "not_connected"
    : status;

  return (
    <div className="rounded-xl border border-orange-100/80 bg-[#FFFBF7] p-5">
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
            <h3 className="font-semibold text-[#0F172A]">{GOCARDLESS.name}</h3>
            <p className="text-xs text-zinc-500">{GOCARDLESS.paymentType}</p>
            <p className="mt-0.5 text-xs font-medium text-[#C2410C]">
              {platformManaged ? "Activora Managed" : GOCARDLESS.tagline}
            </p>
            {loading ? (
              <p className="mt-1 text-sm text-zinc-500">Loading status…</p>
            ) : (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <StatusBadge
                  status={displayStatus}
                  platformUnavailable={configLoaded && platformUnavailable}
                />
                {actionLoading ? (
                  <span className="text-xs font-medium text-zinc-500">
                    Connecting…
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {configLoaded && platformUnavailable ? (
            <FinanceButton disabled>Unavailable</FinanceButton>
          ) : null}

          {!platformManaged &&
          !platformUnavailable &&
          (status === "not_connected" || status === "disconnected") ? (
            <FinanceButton
              onClick={() => void handleConnect()}
              disabled={actionLoading || !platformConfigured}
            >
              {actionLoading ? "Connecting…" : "Connect GoCardless"}
            </FinanceButton>
          ) : null}

          {!platformManaged && !platformUnavailable && (connected || needsSetup) ? (
            <FinanceButton
              variant="secondary"
              onClick={() => void handleManage()}
              disabled={actionLoading}
            >
              Manage GoCardless
            </FinanceButton>
          ) : null}

          {!platformManaged &&
          !platformUnavailable &&
          status !== "not_connected" &&
          status !== "disconnected" ? (
            <FinanceButton
              variant="secondary"
              onClick={() => void handleRefreshStatus()}
              disabled={actionLoading}
            >
              Refresh status
            </FinanceButton>
          ) : null}

          {!platformManaged &&
          !platformUnavailable &&
          status !== "not_connected" &&
          status !== "disconnected" ? (
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

      {configLoaded && platformUnavailable ? (
        <p className="mt-3 text-sm text-zinc-600">{NOT_CONFIGURED_MESSAGE}</p>
      ) : platformManaged ? (
        <p className="mt-3 text-sm text-zinc-600">
          Direct Debit is managed by Activora on your behalf. Enable GoCardless
          in provider settings below to accept Direct Debit payments.
        </p>
      ) : (
        <p className="mt-3 text-sm text-zinc-600">{GOCARDLESS.description}</p>
      )}

      {connected ? (
        <dl className="mt-4 grid gap-3 rounded-xl border border-orange-100 bg-white p-4 text-sm sm:grid-cols-2">
          <DetailField label="Mandate status" value={mandateStatus} />
          <DetailField
            label="Account"
            value={
              clubProfile.clubName ||
              clubProfile.email ||
              "Your club account"
            }
          />
          {clubProfile.email ? (
            <DetailField label="Email" value={clubProfile.email} />
          ) : null}
          {connectedDate ? (
            <DetailField label="Connected" value={connectedDate} />
          ) : null}
          {connection?.merchant_id && !platformManaged ? (
            <DetailField label="Merchant ID" value={connection.merchant_id} mono />
          ) : null}
          {connection?.organisation_id && !platformManaged ? (
            <DetailField
              label="Organisation ID"
              value={connection.organisation_id}
              mono
            />
          ) : null}
        </dl>
      ) : null}

      {!connected && connection?.merchant_id && !platformManaged ? (
        <p className="mt-2 font-mono text-xs text-zinc-500">
          Merchant ID: {connection.merchant_id}
        </p>
      ) : null}

      {!platformManaged && connected ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Disconnecting GoCardless disables Direct Debit payments for your club.
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

function DetailField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </dt>
      <dd
        className={`mt-1 font-medium text-[#0F172A] ${mono ? "font-mono text-xs" : "text-sm"}`}
      >
        {value}
      </dd>
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
