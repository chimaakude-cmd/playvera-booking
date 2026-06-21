"use client";

import { useCallback, useEffect, useState } from "react";
import { getGoCardlessConnection, isGoCardlessConnected } from "@/lib/gocardless";
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
  updateEnabledMethod,
} from "@/lib/payment-providers/storage";
import { getStripeConnectState } from "@/lib/stripe-connect";
import { ClubPaymentProviderSelector } from "./ClubPaymentProviderSelector";
import { FinanceSection } from "./shared";
import { GoCardlessConnectCard } from "./GoCardlessConnectCard";
import { PlatformPaymentStatusCard } from "./PlatformPaymentStatusCard";
import { StripeConnectCard } from "./StripeConnectCard";

export function PaymentProvidersSection() {
  const [settings, setSettings] = useState<PaymentProviderSettings | null>(
    null,
  );

  const refresh = useCallback(() => {
    setSettings(getPaymentProviderSettings());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!settings) {
    return null;
  }

  const stripe = getStripeConnectState();
  const gocardless = getGoCardlessConnection(settings.provider_id);
  const enabledMethods = settings.enabled_methods ?? {
    stripe_card: true,
    gocardless_direct_debit: false,
    manual_invoice: false,
  };
  const stripeConnected = isStripeProviderConnected(stripe.status);
  const gocardlessConnected = isGoCardlessConnected(
    settings.gocardless_status,
    gocardless.merchant_id,
  );
  const stripeEnabled = Boolean(enabledMethods.stripe_card);
  const gocardlessEnabled = Boolean(enabledMethods.gocardless_direct_debit);
  const anyProviderEnabled = stripeEnabled || gocardlessEnabled;

  function toggleMethod(methodId: PaymentMethodId, enabled: boolean) {
    if (methodId === "manual_invoice") {
      return;
    }
    const next = updateEnabledMethod(methodId, enabled);
    setSettings(next);
  }

  return (
    <div className="space-y-6">
      <FinanceSection
        title="Payment providers"
        description="Connect Stripe and/or GoCardless to accept payments. Enable at least one provider for paid activities."
      >
        <div className="space-y-6">
          {PAYMENT_PROVIDER_ORDER.map((providerId) =>
            providerId === "stripe" ? (
              <StripeConnectCard key={providerId} />
            ) : (
              <GoCardlessConnectCard key={providerId} />
            ),
          )}
        </div>
      </FinanceSection>

      <FinanceSection
        title="Provider settings"
        description="Choose which providers are active and your club default for new activities."
      >
        {!anyProviderEnabled ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Enable at least one payment provider below. Free activities remain
            available without payment setup.
          </div>
        ) : null}

        <ul className="divide-y divide-zinc-100">
          {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethodId[]).map(
            (methodId) => {
              const enabled = Boolean(enabledMethods[methodId]);
              const isManual = methodId === "manual_invoice";
              const isStripeMethod = methodId === "stripe_card";
              const canEnable = !isManual && (isStripeMethod ? stripeConnected : true);

              return (
                <li
                  key={methodId}
                  className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
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
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={enabled}
                      disabled={isManual || (!canEnable && !enabled)}
                      onChange={(event) =>
                        toggleMethod(methodId, event.target.checked)
                      }
                      className="h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500 disabled:opacity-50"
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

        <div className="mt-6 border-t border-zinc-100 pt-6">
          <p className="text-sm font-semibold text-zinc-900">
            Default payment provider
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            Used when an activity is set to &ldquo;Use club default&rdquo;.
          </p>
          <div className="mt-4">
            <ClubPaymentProviderSelector onChange={() => refresh()} />
          </div>
        </div>
      </FinanceSection>

      <PlatformPaymentStatusCard />
    </div>
  );
}
