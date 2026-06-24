"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getGoCardlessConnection } from "@/lib/gocardless/storage";
import { isGoCardlessConnected } from "@/lib/gocardless/types";
import {
  hasAnyPaymentProviderReady,
} from "@/lib/payment-providers/availability";
import {
  isStripeOnboardingReturn,
  refreshProviderFinanceState,
} from "@/lib/payment-providers/finance-refresh";
import {
  isStripeProviderConnected,
  PAYMENT_PROVIDER_ORDER,
  type PaymentProviderId,
} from "@/lib/payment-providers/config";
import {
  describeActivePaymentProvider,
  isPaymentSetupComplete,
  isStripePaymentSetupReadyFromState,
} from "@/lib/payment-providers/setup-status";
import {
  PAYMENT_METHOD_DESCRIPTIONS,
  PAYMENT_METHOD_LABELS,
  type PaymentMethodId,
  type PaymentProviderSettings,
} from "@/lib/payment-providers/types";
import {
  getPaymentProviderSettings,
  setClubPaymentModel,
  updateEnabledMethod,
} from "@/lib/payment-providers/storage";
import { getStripeConnectState } from "@/lib/stripe-connect/storage";
import { ClubPaymentProviderSelector } from "./ClubPaymentProviderSelector";
import { FinanceSection } from "./shared";
import { GoCardlessConnectCard } from "./GoCardlessConnectCard";
import { PlatformPaymentStatusCard } from "./PlatformPaymentStatusCard";
import { FinanceSectionErrorBoundary } from "./FinanceSectionErrorBoundary";
import { ProviderFinanceCardErrorBoundary } from "./ProviderFinanceCardErrorBoundary";
import { StripeConnectCard } from "./StripeConnectCard";
import { TRUST_PLATFORM_FEE_NOTE } from "@/constants/trust-payments";

function createSafeSettings(): PaymentProviderSettings {
  try {
    return getPaymentProviderSettings();
  } catch {
    return {
      provider_id: "local-provider",
      stripe_status: "not_connected",
      gocardless_status: "not_connected",
      preferred_payment_provider: "stripe",
      club_default_provider: "stripe",
      enabled_methods: {
        stripe_card: true,
        gocardless_direct_debit: false,
        manual_invoice: false,
      },
      updated_at: new Date().toISOString(),
    };
  }
}

function ConnectCardFallback() {
  return (
    <div className="rounded-xl border border-orange-100/80 bg-[#FFFBF7] p-5">
      <p className="text-sm text-zinc-500">Loading provider…</p>
    </div>
  );
}

function safeReadProviderSnapshot(settings: PaymentProviderSettings) {
  try {
    const stripe = getStripeConnectState();
    const gocardless = getGoCardlessConnection(settings.provider_id);
    const enabledMethods = settings.enabled_methods ?? {
      stripe_card: true,
      gocardless_direct_debit: false,
      manual_invoice: false,
    };
    return {
      stripe,
      gocardless,
      enabledMethods,
      stripeConnected: isStripeProviderConnected(stripe.status),
      stripeReady: isStripePaymentSetupReadyFromState(stripe),
      anyProviderReady: hasAnyPaymentProviderReady(settings.provider_id),
      paymentSetupComplete: isPaymentSetupComplete(settings.provider_id),
    };
  } catch {
    return {
      stripe: getStripeConnectState(),
      gocardless: getGoCardlessConnection(settings.provider_id),
      enabledMethods: {
        stripe_card: true,
        gocardless_direct_debit: false,
        manual_invoice: false,
      },
      stripeConnected: false,
      stripeReady: false,
      anyProviderReady: false,
      paymentSetupComplete: false,
    };
  }
}

function PaymentSetupStatusBanner({
  paymentSetupComplete,
}: {
  paymentSetupComplete: boolean;
}) {
  if (paymentSetupComplete) {
    const activeProvider = describeActivePaymentProvider();
    const description =
      activeProvider === "gocardless"
        ? "GoCardless is connected successfully. Paid activities can now be published."
        : "Stripe is connected successfully. Paid activities can now be published.";

    return (
      <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 px-5 py-4 text-sm text-emerald-950">
        <p className="font-semibold text-emerald-900">Payments active</p>
        <p className="mt-2 text-emerald-800">{description}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
      <p className="font-semibold text-[#0F172A]">
        Payment setup required for paid activities
      </p>
      <p className="mt-2 text-amber-900">
        Connect Stripe and/or GoCardless below before publishing paid
        activities. Free activities remain available without payment setup.
      </p>
    </div>
  );
}

function PaymentProvidersPageAlert({ show }: { show: boolean }) {
  if (!show) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
      <p className="font-semibold text-[#0F172A]">
        Payment providers could not load
      </p>
      <p className="mt-2 text-amber-900">
        We could not load Stripe or GoCardless settings. Refresh the page or
        contact Activora support if this keeps happening.
      </p>
    </div>
  );
}

type ProviderLoadFailures = Record<PaymentProviderId, boolean>;

const INITIAL_PROVIDER_LOAD_FAILURES: ProviderLoadFailures = {
  stripe: false,
  gocardless: false,
};

export function PaymentProvidersSection() {
  const searchParams = useSearchParams();
  const [settings, setSettings] = useState<PaymentProviderSettings>(() =>
    createSafeSettings(),
  );
  const [paymentModel, setPaymentModel] = useState<
    "platform_managed" | "club_oauth"
  >("club_oauth");
  const [refreshing, setRefreshing] = useState(false);
  const [providerLoadFailed, setProviderLoadFailed] =
    useState<ProviderLoadFailures>(INITIAL_PROVIDER_LOAD_FAILURES);

  const refresh = useCallback(() => {
    try {
      setSettings(getPaymentProviderSettings());
    } catch {
      setSettings(createSafeSettings());
    }
  }, []);

  const refreshFinanceState = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await refreshProviderFinanceState(settings.provider_id);
      setSettings(result.settings);
      const model =
        result.paymentStatus?.paymentModel === "platform_managed"
          ? "platform_managed"
          : "club_oauth";
      setPaymentModel(model);
      setClubPaymentModel(model);
    } catch {
      refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh, settings.provider_id]);

  const handleProviderBoundaryError = useCallback((providerId: PaymentProviderId) => {
    setProviderLoadFailed((previous) => ({
      ...previous,
      [providerId]: true,
    }));
  }, []);

  const handleProviderLoadState = useCallback(
    (providerId: PaymentProviderId, failed: boolean) => {
      setProviderLoadFailed((previous) => ({
        ...previous,
        [providerId]: failed,
      }));
    },
    [],
  );

  useEffect(() => {
    void refreshFinanceState();
  }, [refreshFinanceState]);

  useEffect(() => {
    if (!isStripeOnboardingReturn(searchParams)) {
      return;
    }

    void refreshFinanceState();
  }, [searchParams, refreshFinanceState]);

  const {
    stripe,
    gocardless,
    enabledMethods,
    stripeConnected,
    stripeReady,
    anyProviderReady,
    paymentSetupComplete,
  } = safeReadProviderSnapshot(settings);
  const gocardlessConnected = isGoCardlessConnected(
    settings.gocardless_status ?? gocardless.status,
    gocardless.merchant_id,
  );

  const allProvidersFailedToLoad =
    providerLoadFailed.stripe && providerLoadFailed.gocardless;
  const showPageLevelProviderError =
    !paymentSetupComplete && allProvidersFailedToLoad;

  function toggleMethod(methodId: PaymentMethodId, enabled: boolean) {
    if (methodId === "manual_invoice") {
      return;
    }
    try {
      const next = updateEnabledMethod(methodId, enabled, settings.provider_id);
      setSettings(next);
    } catch {
      refresh();
    }
  }

  return (
    <div className="space-y-6">
      <PaymentSetupStatusBanner paymentSetupComplete={paymentSetupComplete} />

      <PaymentProvidersPageAlert show={showPageLevelProviderError} />

      {refreshing ? (
        <p className="text-xs text-zinc-500">Refreshing payment status…</p>
      ) : null}

      <FinanceSection
        title="Payment providers"
        description={
          paymentSetupComplete
            ? "Manage connected payment providers for your club."
            : "Connect Stripe and/or GoCardless to accept payments. Enable at least one provider for paid activities."
        }
      >
        <p className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          {TRUST_PLATFORM_FEE_NOTE}
        </p>
        <div className="space-y-6">
          {PAYMENT_PROVIDER_ORDER.map((providerId) => (
            <ProviderFinanceCardErrorBoundary
              key={providerId}
              providerId={providerId}
              stripeReady={stripeReady}
              onError={handleProviderBoundaryError}
            >
              <Suspense fallback={<ConnectCardFallback />}>
                {providerId === "stripe" ? (
                  <StripeConnectCard onFinanceRefresh={refreshFinanceState} />
                ) : (
                  <GoCardlessConnectCard
                    paymentModel={paymentModel}
                    stripeReady={stripeReady}
                    onLoadStateChange={(failed) =>
                      handleProviderLoadState("gocardless", failed)
                    }
                  />
                )}
              </Suspense>
            </ProviderFinanceCardErrorBoundary>
          ))}
        </div>
      </FinanceSection>

      <FinanceSection
        title="Provider settings"
        description="Choose which providers are active and your club default for new activities."
      >
        {!paymentSetupComplete && !anyProviderReady ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Enable at least one payment provider below. Paid activity publishing
            stays disabled until a provider is connected and enabled.
          </div>
        ) : null}

        <ul className="divide-y divide-orange-100/80">
          {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethodId[]).map(
            (methodId) => {
              const enabled = Boolean(enabledMethods[methodId]);
              const isManual = methodId === "manual_invoice";
              const isStripeMethod = methodId === "stripe_card";
              const isGoCardlessMethod = methodId === "gocardless_direct_debit";
              const canEnable =
                !isManual &&
                (isStripeMethod
                  ? stripeReady || stripeConnected
                  : isGoCardlessMethod
                    ? gocardlessConnected
                    : true);

              return (
                <li
                  key={methodId}
                  className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-[#0F172A]">
                      {PAYMENT_METHOD_LABELS[methodId]}
                      {isManual ? (
                        <span className="ml-2 text-xs font-normal text-zinc-400">
                          Coming soon
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {PAYMENT_METHOD_DESCRIPTIONS[methodId]}
                    </p>
                    {!paymentSetupComplete &&
                    !isManual &&
                    isStripeMethod &&
                    !stripeConnected ? (
                      <p className="mt-1 text-xs text-zinc-500">
                        Connect Stripe above to enable card payments.
                      </p>
                    ) : null}
                    {!paymentSetupComplete &&
                    !isManual &&
                    isGoCardlessMethod &&
                    !gocardlessConnected ? (
                      <p className="mt-1 text-xs text-zinc-500">
                        Connect GoCardless above to enable Direct Debit.
                      </p>
                    ) : null}
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={enabled}
                      disabled={isManual || (!canEnable && !enabled)}
                      onChange={(event) =>
                        toggleMethod(methodId, event.target.checked)
                      }
                      className="h-4 w-4 rounded border-zinc-300 text-[#F87128] focus:ring-[#F87128] disabled:opacity-50"
                    />
                    <span className="text-sm text-zinc-600">
                      {isManual ? "Disabled" : enabled ? "Enabled" : "Off"}
                    </span>
                  </label>
                </li>
              );
            },
          )}
        </ul>

        <div className="mt-6 border-t border-orange-100/80 pt-6">
          <p className="text-sm font-semibold text-[#0F172A]">
            Default payment provider
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            Used when an activity is set to &ldquo;Use club default&rdquo;.
          </p>
          <div className="mt-4">
            <FinanceSectionErrorBoundary title="Default provider selector could not load">
              <ClubPaymentProviderSelector onChange={() => refresh()} />
            </FinanceSectionErrorBoundary>
          </div>
        </div>
      </FinanceSection>

      <FinanceSectionErrorBoundary title="Platform payment status could not load">
        <PlatformPaymentStatusCard />
      </FinanceSectionErrorBoundary>
    </div>
  );
}
