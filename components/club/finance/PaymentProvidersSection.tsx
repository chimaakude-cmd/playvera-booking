"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PLATFORM_FEE_PERCENT,
  calculateStripeConnectPayoutBreakdown,
  formatMoney,
} from "@/lib/payments";
import {
  STRIPE_CONNECT_STATUS_LABELS,
  getStripeConnectState,
  isStripeConnected,
  type StripeConnectStatus,
} from "@/lib/stripe-connect";
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
import { isGoCardlessConnected } from "@/lib/gocardless";
import {
  FinanceButton,
  FinanceSection,
  FinanceStatCard,
} from "./shared";
import { GoCardlessConnectCard } from "./GoCardlessConnectCard";

const SAMPLE_PAYMENT = 50;

function StripeStatusBadge({ status }: { status: StripeConnectStatus }) {
  const styles: Record<StripeConnectStatus, string> = {
    not_connected: "bg-teal-50 text-teal-700 ring-teal-200",
    action_required: "bg-amber-50 text-amber-800 ring-amber-200",
    connected: "bg-sky-50 text-sky-700 ring-sky-200",
    restricted: "bg-rose-50 text-rose-700 ring-rose-200",
    payouts_enabled: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };

  const label =
    status === "not_connected"
      ? "Recommended"
      : STRIPE_CONNECT_STATUS_LABELS[status];

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      {label}
    </span>
  );
}

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
  const stripeBreakdown = calculateStripeConnectPayoutBreakdown(SAMPLE_PAYMENT);
  const stripeConnected = isStripeConnected(stripe.status);
  const gocardlessConnected = isGoCardlessConnected(settings.gocardless_status);

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
        description="Stripe is the primary payment provider. GoCardless is available as a backup for Direct Debit."
        action={
          <FinanceButton variant="secondary" onClick={refresh}>
            Refresh
          </FinanceButton>
        }
      >
        <div className="space-y-6">
          {/* Stripe Connect card */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#635BFF] text-lg font-bold text-white">
                  S
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">
                    Stripe Connect
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Primary · Card payments · United Kingdom
                  </p>
                  <div className="mt-1">
                    <StripeStatusBadge status={stripe.status} />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <FinanceButton
                  variant="secondary"
                  onClick={() => {
                    window.location.href = "/club/finance?tab=stripe";
                  }}
                >
                  Manage Stripe
                </FinanceButton>
              </div>
            </div>
            <p className="mt-3 text-sm text-zinc-600">
              {stripeConnected
                ? "Stripe is connected and ready for card payments."
                : "Connect Stripe for instant card payments — recommended for most clubs."}
            </p>
            {stripe.stripeAccountId ? (
              <p className="mt-2 font-mono text-xs text-zinc-500">
                Account: {stripe.stripeAccountId}
              </p>
            ) : null}
          </div>

          {/* GoCardless card */}
          <GoCardlessConnectCard />
        </div>
      </FinanceSection>

      <FinanceSection
        title="Payment method options"
        description="Choose which payment methods parents can use at checkout."
      >
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
                    {!isManual && !canEnable && enabled ? (
                      <p className="mt-1 text-xs text-amber-700">
                        Provider not connected — connect above to accept this
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
      </FinanceSection>

      <FinanceSection
        title="Fee rules"
        description="How customer payments are split before provider payout."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <FinanceStatCard
            label="Customer payment"
            value={stripeBreakdown.customerPayment}
            hint="Parent pays"
            accent="teal"
          />
          <FinanceStatCard
            label="Processing fee"
            value={stripeBreakdown.stripeProcessingFee}
            hint="Stripe or GoCardless"
            accent="slate"
          />
          <FinanceStatCard
            label="Activora fee"
            value={stripeBreakdown.activoraPlatformFee}
            hint={`${PLATFORM_FEE_PERCENT}% platform fee`}
            accent="violet"
          />
          <FinanceStatCard
            label="Provider payout"
            value={stripeBreakdown.providerPayout}
            hint="Paid to your account"
            accent="emerald"
          />
        </div>

        <div className="mt-5 rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-600">
          <p className="font-medium text-zinc-900">Payment flow</p>
          <p className="mt-2">
            Customer payment → minus processing fee (Stripe or GoCardless) →
            minus Activora {PLATFORM_FEE_PERCENT}% → provider payout
          </p>
        </div>
      </FinanceSection>
    </div>
  );
}
