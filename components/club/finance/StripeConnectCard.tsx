"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  PLATFORM_FEE_PERCENT,
  calculateStripeConnectPayoutBreakdown,
  formatMoney,
} from "@/lib/payments";
import {
  PAYMENT_PROVIDER_DEFINITIONS,
  getStripeConnectionLabel,
  isStripeProviderConnected,
} from "@/lib/payment-providers/config";
import {
  disconnectStripeAccount,
  fetchStripeConnectStatus,
  getStripeConnectState,
  refreshStripeOnboarding,
  resolveStripeConnectProviderId,
  startStripeOnboarding,
  StripeConnectOnboardError,
  type StripeConnectState,
  type StripeConnectStatus,
} from "@/lib/stripe-connect";
import { STRIPE_CONNECT_CLUB_MESSAGES, STRIPE_CONNECT_LOG_PREFIX } from "@/lib/stripe/errors";
import { invalidateStripeConnectStatusCache } from "@/lib/stripe-connect/use-stripe-connect-status";
import { PaymentFeesExplainedLink } from "@/components/trust/PaymentFeesExplainedLink";
import { FinanceButton } from "./shared";

const SAMPLE_PAYMENT = 50;
const STRIPE = PAYMENT_PROVIDER_DEFINITIONS.stripe;

function isStripeSetupComplete(state: StripeConnectState | null): boolean {
  return Boolean(
    state?.stripeAccountId &&
      state.detailsSubmitted &&
      state.chargesEnabled &&
      state.payoutsEnabled,
  );
}

function isStripeSetupIncomplete(state: StripeConnectState | null): boolean {
  return Boolean(state?.stripeAccountId && !isStripeSetupComplete(state));
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

function StatusBadge({ status }: { status: StripeConnectStatus }) {
  const label = getStripeConnectionLabel(status);
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

type ConnectConfig = {
  serverConfigured: boolean;
  clientConfigured: boolean;
  connectReady: boolean;
  connectEnabled: boolean;
  stripe_enabled: boolean;
  connect_enabled: boolean;
  environment: "test" | "live" | null;
};

export function StripeConnectCard() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<StripeConnectState | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [connectConfig, setConnectConfig] = useState<ConnectConfig | null>(null);
  const isDev = process.env.NODE_ENV !== "production";

  useEffect(() => {
    resolveStripeConnectProviderId();
  }, []);

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch("/api/stripe/connect/config");
        if (response.ok) {
          const data = (await response.json()) as {
            serverConfigured: boolean;
            clientConfigured: boolean;
            connectReady: boolean;
            connectEnabled: boolean;
            stripe_enabled?: boolean;
            connect_enabled?: boolean;
            environment?: "test" | "live" | null;
            mode?: "test" | "live" | null;
          };
          setConnectConfig({
            serverConfigured: data.serverConfigured,
            clientConfigured: data.clientConfigured,
            connectReady: data.connectReady,
            connectEnabled: data.connectEnabled,
            stripe_enabled: Boolean(data.stripe_enabled ?? data.serverConfigured),
            connect_enabled: Boolean(data.connect_enabled ?? data.connectEnabled),
            environment: data.environment ?? data.mode ?? null,
          });
        } else {
          setConnectConfig(null);
        }
      } catch {
        setConnectConfig(null);
      }
    }

    void loadConfig();
  }, []);

  const refreshStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    invalidateStripeConnectStatusCache();

    try {
      const current = getStripeConnectState();
      if (current.stripeAccountId) {
        const updated = await fetchStripeConnectStatus(current.stripeAccountId);
        setState(updated);
      } else {
        setState(current);
      }
    } catch (refreshError) {
      setState(getStripeConnectState());
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Could not refresh Stripe status.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    const stripeComplete = searchParams.get("stripe") === "complete";
    const stripeRefresh =
      searchParams.get("stripe") === "refresh" ||
      searchParams.get("retry") === "1";
    const connected =
      searchParams.get("connected") === "1" ||
      searchParams.get("stripe") === "connected" ||
      stripeComplete;
    const refresh =
      searchParams.get("refresh") === "1" || stripeRefresh;

    if (connected || refresh) {
      void refreshStatus();
      if (stripeComplete || searchParams.get("connected") === "1") {
        setMessage("Returned from Stripe. Your connection status has been updated.");
      }
    }
  }, [searchParams, refreshStatus]);

  function handleOnboardError(onboardError: unknown) {
    if (onboardError instanceof StripeConnectOnboardError) {
      setError(onboardError.message);
      return;
    }

    setError(
      onboardError instanceof Error
        ? onboardError.message
        : "Could not start Stripe Connect.",
    );
  }

  async function handleConnect() {
    setActionLoading(true);
    setError(null);
    setMessage(null);

    try {
      console.log(STRIPE_CONNECT_LOG_PREFIX, { step: "onboard.ui.click" });
      const { url } = await startStripeOnboarding();
      window.location.href = url;
    } catch (connectError) {
      handleOnboardError(connectError);
      setActionLoading(false);
    }
  }

  async function handleManage() {
    setActionLoading(true);
    setError(null);

    try {
      const { url } = await refreshStripeOnboarding();
      window.location.href = url;
    } catch (continueError) {
      handleOnboardError(continueError);
      setActionLoading(false);
    }
  }

  async function handleDisconnect() {
    if (
      !window.confirm(
        "Disconnect Stripe? Paid bookings will pause until you reconnect.",
      )
    ) {
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const next = await disconnectStripeAccount();
      setState(next);
      setMessage("Stripe account disconnected.");
    } catch (disconnectError) {
      setError(
        disconnectError instanceof Error
          ? disconnectError.message
          : "Could not disconnect Stripe.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  const breakdown = calculateStripeConnectPayoutBreakdown(SAMPLE_PAYMENT);
  const status = state?.status ?? "not_connected";
  const setupComplete = isStripeSetupComplete(state);
  const setupIncomplete = isStripeSetupIncomplete(state);
  const connected = isStripeProviderConnected(status);
  const connectedDate = formatConnectedDate(state?.updatedAt);
  const serverConfigured = connectConfig?.serverConfigured ?? true;
  const configLoaded = connectConfig !== null;

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
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white"
            style={{ backgroundColor: STRIPE.brandColor }}
          >
            {STRIPE.brandInitial}
          </div>
          <div>
            <h3 className="font-semibold text-[#0F172A]">{STRIPE.name}</h3>
            <p className="text-xs text-zinc-500">{STRIPE.paymentType}</p>
            <p className="mt-0.5 text-xs font-medium text-[#C2410C]">
              {STRIPE.tagline}
            </p>
            {loading ? (
              <p className="mt-1 text-sm text-zinc-500">Loading status…</p>
            ) : (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <StatusBadge status={status} />
                {actionLoading && !state?.stripeAccountId ? (
                  <span className="text-xs font-medium text-zinc-500">
                    Connecting…
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {!state?.stripeAccountId ? (
            <FinanceButton
              onClick={() => void handleConnect()}
              disabled={actionLoading || !serverConfigured}
            >
              {actionLoading ? "Connecting…" : "Connect Stripe"}
            </FinanceButton>
          ) : null}

          {setupIncomplete ? (
            <FinanceButton
              onClick={() => void handleManage()}
              disabled={actionLoading}
            >
              Continue setup
            </FinanceButton>
          ) : null}

          {setupComplete ? (
            <FinanceButton
              variant="secondary"
              onClick={() => void handleManage()}
              disabled={actionLoading}
            >
              Manage Stripe
            </FinanceButton>
          ) : null}

          <FinanceButton
            variant="secondary"
            onClick={() => void refreshStatus()}
            disabled={loading || actionLoading}
          >
            Refresh status
          </FinanceButton>

          {state?.stripeAccountId ? (
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

      <p className="mt-3 text-sm text-zinc-600">{STRIPE.description}</p>
      <p className="mt-2">
        <PaymentFeesExplainedLink provider="stripe" />
      </p>

      {state?.stripeAccountId ? (
        <dl className="mt-4 grid gap-3 rounded-xl border border-orange-100 bg-white p-4 text-sm sm:grid-cols-2">
          <StripeDetailField
            label="Charges enabled"
            value={state.chargesEnabled ? "Yes" : "No"}
            positive={state.chargesEnabled}
          />
          <StripeDetailField
            label="Payouts enabled"
            value={state.payoutsEnabled ? "Yes" : "No"}
            positive={state.payoutsEnabled}
          />
          {connectedDate ? (
            <StripeDetailField label="Connected" value={connectedDate} />
          ) : null}
          <StripeDetailField
            label="Account"
            value={state.stripeAccountId}
            mono
          />
        </dl>
      ) : null}

      {state?.requirementsDue?.length ? (
        <p className="mt-2 text-xs text-amber-700">
          Requirements due: {state.requirementsDue.join(", ")}
        </p>
      ) : null}

      {!connected && configLoaded && !serverConfigured && isDev ? (
        <p className="mt-3 text-xs text-amber-800">
          {STRIPE_CONNECT_CLUB_MESSAGES.notConfigured}
        </p>
      ) : null}

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Best for
        </p>
        <ul className="mt-2 list-inside list-disc text-sm text-zinc-600">
          {STRIPE.bestFor.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4 max-w-lg rounded-xl border border-zinc-100 bg-white p-4 text-sm">
        <p className="font-medium text-zinc-900">
          Fee breakdown (example £{SAMPLE_PAYMENT} payment — estimates only)
        </p>
        <dl className="mt-3 space-y-2">
          <BreakdownRow label="Customer payment" value={breakdown.customerPayment} />
          <BreakdownRow
            label="Stripe processing fee"
            value={breakdown.stripeProcessingFee}
            negative
          />
          <BreakdownRow
            label={`Activora fee (${PLATFORM_FEE_PERCENT}%)`}
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
      </div>

      {configLoaded ? (
        <details className="mt-4 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm">
          <summary className="cursor-pointer text-xs font-semibold text-zinc-600">
            Stripe diagnostics
          </summary>
          <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            <DebugField
              label="stripe_enabled"
              value={String(connectConfig?.stripe_enabled ?? serverConfigured)}
            />
            <DebugField
              label="connect_enabled"
              value={String(connectConfig?.connect_enabled ?? false)}
            />
            <DebugField
              label="account_exists"
              value={String(Boolean(state?.stripeAccountId))}
            />
            <DebugField
              label="charges_enabled"
              value={String(Boolean(state?.chargesEnabled))}
            />
            <DebugField
              label="payouts_enabled"
              value={String(Boolean(state?.payoutsEnabled))}
            />
            <DebugField
              label="onboarding_required"
              value={String(!setupComplete)}
            />
            <DebugField
              label="environment"
              value={connectConfig?.environment ?? "unknown"}
            />
          </dl>
        </details>
      ) : null}
    </div>
  );
}

function StripeDetailField({
  label,
  value,
  mono = false,
  positive,
}: {
  label: string;
  value: string;
  mono?: boolean;
  positive?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </dt>
      <dd
        className={`mt-1 font-medium ${
          positive === true
            ? "text-emerald-700"
            : positive === false
              ? "text-amber-700"
              : "text-[#0F172A]"
        } ${mono ? "font-mono text-xs" : "text-sm"}`}
      >
        {value}
      </dd>
    </div>
  );
}

function DebugField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 font-mono">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-semibold text-zinc-800">{value}</dd>
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
