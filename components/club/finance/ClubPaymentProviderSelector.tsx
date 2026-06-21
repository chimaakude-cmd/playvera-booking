"use client";

import { useEffect, useState } from "react";
import {
  getPaymentProviderSettings,
  setClubDefaultPaymentProvider,
} from "@/lib/payment-providers/storage";
import {
  CLUB_DEFAULT_PAYMENT_PROVIDER_OPTIONS,
  type ClubDefaultPaymentProvider,
} from "@/lib/payment-providers/types";

type ClubPaymentProviderSelectorProps = {
  onChange?: (provider: ClubDefaultPaymentProvider) => void;
  compact?: boolean;
};

export function ClubPaymentProviderSelector({
  onChange,
  compact = false,
}: ClubPaymentProviderSelectorProps) {
  const [selected, setSelected] = useState<ClubDefaultPaymentProvider>("stripe");

  useEffect(() => {
    setSelected(getPaymentProviderSettings().club_default_provider);
  }, []);

  function handleSelect(provider: ClubDefaultPaymentProvider) {
    setSelected(provider);
    setClubDefaultPaymentProvider(provider);
    onChange?.(provider);
  }

  return (
    <fieldset className={compact ? "space-y-2" : "space-y-3"}>
      <legend className="sr-only">Payment provider</legend>
      {CLUB_DEFAULT_PAYMENT_PROVIDER_OPTIONS.map((option) => {
        const isSelected = selected === option.value;

        return (
          <label
            key={option.value}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
              isSelected
                ? "border-teal-300 bg-teal-50/60 ring-1 ring-teal-200"
                : "border-zinc-200 bg-white hover:border-zinc-300"
            }`}
          >
            <input
              type="radio"
              name="club-payment-provider"
              checked={isSelected}
              onChange={() => handleSelect(option.value)}
              className="mt-1 text-teal-600 focus:ring-teal-500"
            />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-zinc-900">
                {option.label}
              </span>
              <span className="mt-0.5 block text-sm text-zinc-600">
                {option.description}
              </span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
