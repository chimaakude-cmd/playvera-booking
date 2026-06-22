"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { getGoCardlessConnection } from "@/lib/gocardless/storage";
import { isGoCardlessConnected } from "@/lib/gocardless/types";
import {
  hasAnyPaymentProviderReady,
  isClubPaymentsConfigured,
} from "@/lib/payment-providers/availability";
import {
  isStripeProviderConnected,
  PAYMENT_PROVIDER_ORDER,
} from "@/lib/payment-providers/config";
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
import type { ClubPaymentStatusApiResponse } from "@/lib/payments/club-payment-status";
import { getStripeConnectState } from "@/lib/stripe-connect/storage";
import { ClubPaymentProviderSelector } from "./ClubPaymentProviderSelector";
import { FinanceSection } from "./shared";
import { GoCardlessConnectCard } from "./GoCardlessConnectCard";
import { PlatformPaymentStatusCard } from "./PlatformPaymentStatusCard";
import { FinanceSectionErrorBoundary } from "./FinanceSectionErrorBoundary";
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
      anyProviderReady: hasAnyPaymentProviderReady(settings.provider_id),
      paymentsConfigured: isClubPaymentsConfigured(settings.provider_id),
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
      anyProviderReady: false,
      paymentsConfigured: false,
    };
  }
}

export function PaymentProvidersSection() {
  const [settings, setSettings] = useState<PaymentProviderSettings>(() =>
    createSafeSettings(),
  );
  const [paymentModel, setPaymentModel] = useState<
    "platform_managed" | "club_oauth"
  >("club_oauth");

  const refresh = useCallback(() => {
    try {
      setSettings(getPaymentProviderSettings());
    } catch {
      setSettings(createSafeSettings());
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    async function loadPaymentStatus() {
      try {
        const response = await fetch("/api/club/payment-status");
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as ClubPaymentStatusApiResponse;
        const model =
          payload.paymentModel === "platform_managed"
            ? "platform_managed"
            : "club_oauth";
        setPaymentModel(model);
        setClubPaymentModel(model);
      } catch {
        // Keep defaults — page must remain usable without a provider row.
      }
    }

    void loadPaymentStatus();
  }, []);

  const {
    stripe,
    gocardless,
    enabledMethods,
    stripeConnected,
    anyProviderReady,
    paymentsConfigured,
  } = safeReadProviderSnapshot(settings);
  const gocardlessConnected = isGoCardlessConnected(
    settings.gocardless_status ?? gocardless.status,
    gocardless.merchant_id,
  );

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
      {!paymentsConfigured ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          <p className="font-semibold text-[#0F172A]">
            Payment setup required for paid activities
          </p>
          <p className="mt-2 text-amber-900">
            Connect Stripe and/or enable GoCardless below before publishing paid
            activities. Free activities remain available without payment setup.
          </p>
        </div>
      ) : null}

      <FinanceSection
        title="Payment providers"
        description="Connect Stripe and/or GoCardless to accept payments. Enable at least one provider for paid activities."
      >
        <p className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          {TRUST_PLATFORM_FEE_NOTE}
        </p>
        <div className="space-y-6">
          {PAYMENT_PROVIDER_ORDER.map((providerId) => (
            <FinanceSectionErrorBoundary
              key={providerId}
              title={
                providerId === "stripe"
                  ? "Stripe Connect could not load"
                  : "GoCardless could not load"
              }
            >
              <Suspense fallback={<ConnectCardFallback />}>
                {providerId === "stripe" ? (
                  <StripeConnectCard />
                ) : (
                  <GoCardlessConnectCard paymentModel={paymentModel} />
                )}
              </Suspense>
            </FinanceSectionErrorBoundary>
          ))}
        </div>
      </FinanceSection>

      <FinanceSection
        title="Provider settings"
        description="Choose which providers are active and your club default for new activities."
      >
        {!anyProviderReady ? (
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
                  ? stripeConnected
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
                    {!isManual && isStripeMethod && !stripeConnected ? (
                      <p className="mt-1 text-xs text-zinc-500">
                        Connect Stripe above to enable card payments.
                      </p>
                    ) : null}
                    {!isManual &&
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
