"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  PLATFORM_FEE_PERCENT,
  calculateStripeConnectPayoutBreakdown,
  formatMoney,
} from "@/lib/payments";
import {
  STRIPE_CONNECT_STATUS_LABELS,
  disconnectStripeAccount,
  fetchStripeConnectStatus,
  getStripeConnectState,
  refreshStripeOnboarding,
  startStripeOnboarding,
  StripeConnectOnboardError,
  type StripeConnectState,
  type StripeConnectStatus,
} from "@/lib/stripe-connect";
import { STRIPE_CONNECT_CLUB_MESSAGES } from "@/lib/stripe/errors";
import { StripeConnectUnavailableNotice } from "./StripeConnectUnavailableNotice";
import { formatFinanceShortDate } from "@/lib/club-finance";
import { invalidateStripeConnectStatusCache } from "@/lib/stripe-connect/use-stripe-connect-status";
import {
  FinanceButton,
  FinanceSection,
  FinanceStatCard,
} from "./shared";

const SAMPLE_PAYMENT = 50;

function StatusBadge({ status }: { status: StripeConnectStatus }) {
  const styles: Record<StripeConnectStatus, string> = {
    not_connected: "bg-zinc-100 text-zinc-600 ring-zinc-200",
    action_required: "bg-amber-50 text-amber-800 ring-amber-200",
    connected: "bg-sky-50 text-sky-700 ring-sky-200",
    restricted: "bg-rose-50 text-rose-700 ring-rose-200",
    payouts_enabled: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      {STRIPE_CONNECT_STATUS_LABELS[status]}
    </span>
  );
}

export function FinanceStripeConnectSection() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<StripeConnectState | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<
    "platform_unavailable" | "transient" | "not_configured" | null
  >(null);
  const [adminDetail, setAdminDetail] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [connectConfig, setConnectConfig] = useState<{
    serverConfigured: boolean;
    clientConfigured: boolean;
    connectReady: boolean;
    connectEnabled: boolean;
    platformUnavailable: boolean;
    publishableKeySource: "next_public" | "server" | null;
  } | null>(null);
  const [platformUnavailable, setPlatformUnavailable] = useState(false);
  const isDev = process.env.NODE_ENV !== "production";

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
            platformUnavailable?: boolean;
            publishableKeySource: "next_public" | "server" | null;
            validationErrors?: string[];
            adminDetail?: string;
          };
          setConnectConfig({
            serverConfigured: data.serverConfigured,
            clientConfigured: data.clientConfigured,
            connectReady: data.connectReady,
            connectEnabled: data.connectEnabled,
            platformUnavailable: Boolean(data.platformUnavailable),
            publishableKeySource: data.publishableKeySource,
          });
          setPlatformUnavailable(Boolean(data.platformUnavailable));
          setAdminDetail(data.adminDetail ?? null);

          if (!data.serverConfigured) {
            if (isDev) {
              setError(
                "Add STRIPE_SECRET_KEY (sk_test_...) to .env.local and restart npm run dev.",
              );
            } else {
              setError(null);
              setErrorCode("platform_unavailable");
            }
          } else if (data.platformUnavailable) {
            setError(null);
            setErrorCode("platform_unavailable");
          } else {
            setError(null);
            setErrorCode(null);
          }
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
    const connected =
      searchParams.get("connected") === "1" ||
      searchParams.get("stripe") === "connected";
    const refresh = searchParams.get("refresh") === "1";

    if (connected || refresh) {
      void refreshStatus();
      if (connected) {
        setMessage("Returned from Stripe. Your connection status has been updated.");
      }
    }
  }, [searchParams, refreshStatus]);

  function handleOnboardError(onboardError: unknown) {
    if (onboardError instanceof StripeConnectOnboardError) {
      setError(onboardError.message);
      setErrorCode(onboardError.code);
      setAdminDetail(onboardError.adminDetail ?? null);
      if (onboardError.code === "platform_unavailable") {
        setPlatformUnavailable(true);
      }
      return;
    }

    setError(
      onboardError instanceof Error
        ? onboardError.message
        : "Could not start Stripe Connect.",
    );
    setErrorCode("transient");
  }

  async function handleConnect() {
    setActionLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { url } = await startStripeOnboarding();
      window.location.assign(url);
    } catch (connectError) {
      handleOnboardError(connectError);
      setActionLoading(false);
    }
  }

  async function handleContinueOnboarding() {
    setActionLoading(true);
    setError(null);

    try {
      const { url } = await refreshStripeOnboarding();
      window.location.assign(url);
    } catch (continueError) {
      handleOnboardError(continueError);
      setActionLoading(false);
    }
  }

  async function handleDisconnect() {
    if (
      !window.confirm(
        "Disconnect Stripe? Bookings and payouts will pause until you reconnect.",
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
  const dashboard = state?.dashboard;
  const connectReady = connectConfig?.connectReady ?? false;
  const clientConfigured = connectConfig?.clientConfigured ?? false;
  const serverConfigured = connectConfig?.serverConfigured ?? false;
  const configLoaded = connectConfig !== null;
  const showSetupGuide = isDev && configLoaded && !serverConfigured;
  const showPlatformUnavailable =
    platformUnavailable || errorCode === "platform_unavailable";
  const showTransientError = Boolean(error) && !showPlatformUnavailable;

  return (
    <div className="space-y-6">
      {message ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </div>
      ) : null}

      {showTransientError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {showPlatformUnavailable ? (
        <StripeConnectUnavailableNotice
          message={STRIPE_CONNECT_CLUB_MESSAGES.platformUnavailable}
          adminDetail={adminDetail}
          onTryAgain={() => {
            setError(null);
            setErrorCode(null);
            void refreshStatus();
          }}
          tryAgainLoading={loading}
        />
      ) : null}

      {showSetupGuide ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Stripe test setup required</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>
              Open Stripe Dashboard → Developers → API keys (test mode).
            </li>
            <li>
              Add <code className="rounded bg-amber-100 px-1">STRIPE_SECRET_KEY</code>{" "}
              (sk_test_...) and{" "}
              <code className="rounded bg-amber-100 px-1">
                NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
              </code>{" "}
              (pk_test_...) to{" "}
              <code className="rounded bg-amber-100 px-1">.env.local</code>.
              The publishable key cannot be derived from the secret key.
            </li>
            <li>
              Optional: run{" "}
              <code className="rounded bg-amber-100 px-1">
                npm run sync:stripe-publishable
              </code>{" "}
              if Stripe CLI is logged in with the same account.
            </li>
            <li>
              Enable Connect: Settings → Connect → Platform / Marketplace →
              Express · United Kingdom.
            </li>
            <li>
              Leave <code className="rounded bg-amber-100 px-1">STRIPE_WEBHOOK_SECRET</code>{" "}
              empty for now.
            </li>
            <li>
              Restart <code className="rounded bg-amber-100 px-1">npm run dev</code>, then
              run <code className="rounded bg-amber-100 px-1">npm run check:stripe-env</code>.
            </li>
          </ol>
        </div>
      ) : null}

      {isDev && serverConfigured && connectReady && !clientConfigured ? (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <p className="font-semibold">Publishable key recommended</p>
          <p className="mt-1">
            Connect onboarding works with the server secret key only. Add{" "}
            <code className="rounded bg-sky-100 px-1">
              NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
            </code>{" "}
            to <code className="rounded bg-sky-100 px-1">.env.local</code> for
            future client-side Stripe.js features, then restart the dev server.
          </p>
        </div>
      ) : null}

      <FinanceSection
        title="Stripe Connect"
        description="Connect your Stripe Express account (UK) to receive booking payouts directly. Activora takes a 2% platform fee on each booking."
        action={
          <FinanceButton
            variant="secondary"
            onClick={() => void refreshStatus()}
            disabled={loading || actionLoading}
          >
            Refresh status
          </FinanceButton>
        }
      >
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50/60 p-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#635BFF] text-lg font-bold text-white">
                S
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900">Stripe account</h3>
                <p className="text-xs text-zinc-500">Express · United Kingdom · Activora</p>
                {loading ? (
                  <p className="mt-1 text-sm text-zinc-500">Loading status…</p>
                ) : (
                  <div className="mt-1">
                    <StatusBadge status={status} />
                  </div>
                )}
              </div>
            </div>

            {state?.stripeAccountId ? (
              <p className="mt-3 font-mono text-xs text-zinc-500">
                Account ID: {state.stripeAccountId}
              </p>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">
                No Stripe account connected yet. Providers receive payouts directly to their bank once connected.
              </p>
            )}

            {state?.requirementsDue?.length ? (
              <p className="mt-2 text-xs text-amber-700">
                Requirements due: {state.requirementsDue.join(", ")}
              </p>
            ) : null}

            {state?.disabledReason ? (
              <p className="mt-2 text-xs text-rose-700">
                Restricted: {state.disabledReason}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {status === "not_connected" ? (
              <FinanceButton
                onClick={() => void handleConnect()}
                disabled={actionLoading || !connectReady || showPlatformUnavailable}
              >
                Connect Stripe
              </FinanceButton>
            ) : null}

            {status === "action_required" || status === "restricted" ? (
              <FinanceButton
                onClick={() => void handleContinueOnboarding()}
                disabled={actionLoading}
              >
                {status === "restricted" ? "Resolve in Stripe" : "Complete setup"}
              </FinanceButton>
            ) : null}

            {status !== "not_connected" ? (
              <>
                <FinanceButton
                  variant="secondary"
                  onClick={() => void handleContinueOnboarding()}
                  disabled={actionLoading}
                >
                  Reconnect
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

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <CapabilityPill
            label="Charges"
            enabled={Boolean(state?.chargesEnabled)}
          />
          <CapabilityPill
            label="Payouts"
            enabled={Boolean(state?.payoutsEnabled)}
          />
          <CapabilityPill
            label="Details submitted"
            enabled={Boolean(state?.detailsSubmitted)}
          />
        </div>
      </FinanceSection>

      {dashboard && status !== "not_connected" ? (
        <FinanceSection
          title="Stripe dashboard sync"
          description="Live data from your connected Stripe Express account."
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <DashboardItem
              label="Payout schedule"
              value={dashboard.payoutSchedule ?? "Not set yet"}
            />
            <DashboardItem
              label="Available balance"
              value={formatMoney(dashboard.availableBalance)}
            />
            <DashboardItem
              label="Pending balance"
              value={formatMoney(dashboard.pendingBalance)}
            />
            <DashboardItem
              label="Last payout"
              value={
                dashboard.lastPayoutAmount
                  ? `${formatMoney(dashboard.lastPayoutAmount)}${
                      dashboard.lastPayoutDate
                        ? ` · ${formatFinanceShortDate(dashboard.lastPayoutDate)}`
                        : ""
                    }`
                  : "No payouts yet"
              }
            />
            <DashboardItem
              label="Verification status"
              value={dashboard.verificationStatus}
            />
            <DashboardItem
              label="Currency"
              value={dashboard.currency}
            />
          </div>
        </FinanceSection>
      ) : null}

      <FinanceSection
        title="Booking payment breakdown"
        description={`How a £${SAMPLE_PAYMENT} customer payment is split.`}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <FinanceStatCard
            label="Customer payment"
            value={breakdown.customerPayment}
            hint="Parent pays"
            accent="teal"
          />
          <FinanceStatCard
            label="Stripe processing fee"
            value={breakdown.stripeProcessingFee}
            hint="Deducted by Stripe"
            accent="slate"
          />
          <FinanceStatCard
            label="Activora fee"
            value={breakdown.activoraPlatformFee}
            hint={`${PLATFORM_FEE_PERCENT}% platform fee`}
            accent="violet"
          />
          <FinanceStatCard
            label="Provider payout"
            value={breakdown.providerPayout}
            hint="Paid to your Stripe account"
            accent="emerald"
          />
        </div>

        <div className="mt-5 max-w-lg rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm">
          <dl className="space-y-2">
            <BreakdownRow label="Customer payment" value={breakdown.customerPayment} />
            <BreakdownRow
              label="Stripe processing fee"
              value={breakdown.stripeProcessingFee}
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
        </div>
      </FinanceSection>
    </div>
  );
}

function DashboardItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-white px-4 py-3">
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

function CapabilityPill({
  label,
  enabled,
}: {
  label: string;
  enabled: boolean;
}) {
  return (
    <div
      className={`rounded-lg px-3 py-2 text-sm ${
        enabled
          ? "bg-emerald-50 text-emerald-800"
          : "bg-zinc-100 text-zinc-500"
      }`}
    >
      <span className="font-medium">{label}:</span>{" "}
      {enabled ? "Enabled" : "Pending"}
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
