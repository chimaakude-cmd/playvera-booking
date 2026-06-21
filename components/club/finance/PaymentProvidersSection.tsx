"use client";

import { useCallback, useEffect, useState } from "react";
import { isGoCardlessConnected } from "@/lib/gocardless";
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
import { FinanceSection } from "./shared";
import { GoCardlessConnectCard } from "./GoCardlessConnectCard";
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
  const stripeConnected = isStripeProviderConnected(stripe.status);
  const gocardlessConnected = isGoCardlessConnected(settings.gocardless_status);
  const anyProviderConnected = stripeConnected || gocardlessConnected;

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
        description="Choose how your club accepts payments. You can connect Stripe, GoCardless, or both."
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
        title="Accepted payment methods"
        description="Enable checkout options for parents once the matching provider is connected."
      >
        {!anyProviderConnected ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            No payment provider connected yet. Paid activities cannot take
            payments until you connect Stripe or GoCardless. Free activities
            remain available.
          </div>
        ) : null}

        <ul className="divide-y divide-zinc-100">
          {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethodId[]).map(
            (methodId) => {
              const enabled = settings.enabled_methods[methodId];
              const isManual = methodId === "manual_invoice";
              const canEnable =
                !isManual &&
                (methodId === "stripe_card"
                  ? stripeConnected
                  : gocardlessConnected);

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
                    {!isManual && !canEnable ? (
                      <p className="mt-1 text-xs text-zinc-500">
                        Connect the provider above to enable this method.
                      </p>
                    ) : null}
                    {!isManual && !canEnable && enabled ? (
                      <p className="mt-1 text-xs text-amber-700">
                        Provider not connected — reconnect above to accept this
                        method.
                      </p>
                    ) : null}
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={enabled}
                      disabled={isManual || (!canEnable && !enabled)}
                      onChange={(e) =>
                        toggleMethod(methodId, e.target.checked)
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

        {stripeConnected && gocardlessConnected ? (
          <p className="mt-4 text-sm text-zinc-600">
            Both providers are connected — you can enable card and Direct Debit
            checkout together.
          </p>
        ) : null}
      </FinanceSection>
    </div>
  );
}
