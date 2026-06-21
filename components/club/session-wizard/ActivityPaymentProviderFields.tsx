"use client";

import {
  ACTIVITY_PAYMENT_PROVIDER_OPTIONS,
  getActivityPaymentProviderLabel,
  type ActivityPaymentProvider,
} from "@/lib/payment-providers/types";
import { getPaymentProviderSettings } from "@/lib/payment-providers/storage";

type ActivityPaymentProviderFieldsProps = {
  value: ActivityPaymentProvider;
  onChange: (value: ActivityPaymentProvider) => void;
};

export function ActivityPaymentProviderFields({
  value,
  onChange,
}: ActivityPaymentProviderFieldsProps) {
  const clubDefault = getPaymentProviderSettings().club_default_provider;

  return (
    <div className="space-y-3 rounded-2xl border border-orange-100/80 bg-[#FFFBF7] p-5">
      <div>
        <h3 className="text-base font-semibold text-[#0F172A]">
          Payment provider
        </h3>
        <p className="mt-1 text-sm text-zinc-600">
          Choose how parents pay for this activity. Club default:{" "}
          {getActivityPaymentProviderLabel("club_default", clubDefault)}.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Examples — holiday camp → Stripe, monthly subscription → GoCardless,
          flexible bookings → Accept both.
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="sr-only">Activity payment provider</legend>
        {ACTIVITY_PAYMENT_PROVIDER_OPTIONS.map((option) => {
          const isSelected = value === option.value;

          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                isSelected
                  ? "border-[#F87128] bg-orange-50/80 ring-1 ring-[#F87128]/20"
                  : "border-orange-100/80 bg-white hover:border-orange-200"
              }`}
            >
              <input
                type="radio"
                name="activity-payment-provider"
                checked={isSelected}
                onChange={() => onChange(option.value)}
                className="mt-0.5 text-[#F87128] focus:ring-[#F87128]"
              />
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-zinc-900">
                    {option.label}
                  </span>
                  {option.example ? (
                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#C2410C]">
                      e.g. {option.example}
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block text-xs text-zinc-500">
                  {option.description}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}
