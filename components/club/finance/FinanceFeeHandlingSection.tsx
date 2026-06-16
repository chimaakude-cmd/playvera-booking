"use client";

import { FormEvent, useEffect, useState } from "react";
import { PayoutRows } from "@/components/club/ProviderPayoutBreakdown";
import {
  DEFAULT_FEE_SETTINGS,
  feeHandlingDescriptions,
  feeHandlingLabels,
  FeeHandling,
  FeeSettings,
  getFeeSettings,
  saveFeeSettings,
} from "@/lib/fee-settings";
import {
  calculatePaymentBreakdown,
  STRIPE_FEE_FIXED,
  STRIPE_FEE_PERCENT,
} from "@/lib/payments";
import { PricingDisclaimer } from "@/components/pricing/PricingDisclaimer";
import { FinanceButton, FinanceSection } from "./shared";

const SAMPLE_PRICE = 50;

export function FinanceFeeHandlingSection() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<FeeSettings>(DEFAULT_FEE_SETTINGS);

  useEffect(() => {
    setSettings(getFeeSettings());
  }, []);

  const preview = calculatePaymentBreakdown(
    SAMPLE_PRICE,
    settings.platformFeePercent,
    settings.feeHandling,
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveFeeSettings(settings);
    setSaved(true);
  }

  return (
    <div className="space-y-6">
      {saved ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Fee settings saved successfully
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <FinanceSection
          title="Fee handling"
          description="Choose how Activora platform and Stripe fees affect customer pricing and your payout."
        >
          <div className="space-y-3">
            {(Object.keys(feeHandlingLabels) as FeeHandling[]).map((option) => (
              <label
                key={option}
                className={`flex cursor-pointer gap-4 rounded-xl border p-4 transition-colors ${
                  settings.feeHandling === option
                    ? "border-zinc-900 bg-zinc-50"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <input
                  type="radio"
                  name="feeHandling"
                  value={option}
                  checked={settings.feeHandling === option}
                  onChange={() => {
                    setSettings((current) => ({
                      ...current,
                      feeHandling: option,
                    }));
                    setSaved(false);
                  }}
                  className="mt-1"
                />
                <div>
                  <span className="text-sm font-semibold text-zinc-900">
                    {feeHandlingLabels[option]}
                  </span>
                  <p className="mt-1 text-sm text-zinc-500">
                    {feeHandlingDescriptions[option]}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </FinanceSection>

        <div className="grid gap-6 lg:grid-cols-2">
          <FinanceSection
            title="Platform fee"
            description="Activora platform fee applied to each booking."
          >
            <p className="text-3xl font-bold tracking-tight text-zinc-900">
              {settings.platformFeePercent}%
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Set by your subscription plan — upgrade in Settings → Subscription.
            </p>
            <PricingDisclaimer className="mt-3" />
          </FinanceSection>

          <FinanceSection
            title="Stripe processing fee"
            description="Placeholder rate used for payout estimates only."
          >
            <p className="text-lg font-semibold text-zinc-900">
              {STRIPE_FEE_PERCENT}% + £{STRIPE_FEE_FIXED.toFixed(2)}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Per transaction — actual Stripe fees apply when Connect is live.
            </p>
          </FinanceSection>
        </div>

        <FinanceSection
          title="Payout preview"
          description={`Example breakdown for a £${SAMPLE_PRICE} session price.`}
        >
          <div className="max-w-md rounded-xl border border-zinc-100 bg-zinc-50 p-4">
            <PayoutRows breakdown={preview} />
          </div>
        </FinanceSection>

        <FinanceButton type="submit">Save fee settings</FinanceButton>
      </form>
    </div>
  );
}
