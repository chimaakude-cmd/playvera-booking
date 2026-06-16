/**
 * Club fee settings persistence (localStorage).
 *
 * Storage key: activora-fee-settings
 *
 * Supabase migration:
 * - Table: public.club_settings
 * - Access via: dataLayer.feeSettings
 */
import { DEFAULT_PLAN_ID, getPlanByIdOrDefault } from "@/src/config/pricing";
import { getProviderSubscription } from "@/lib/provider-subscription";

export type FeeHandling =
  | "provider_absorbs"
  | "fees_on_top"
  | "split_fee";

export type FeeSettings = {
  feeHandling: FeeHandling;
  platformFeePercent: number;
};

export const FEE_SETTINGS_STORAGE_KEY = "activora-fee-settings";

export const DEFAULT_FEE_SETTINGS: FeeSettings = {
  feeHandling: "provider_absorbs",
  platformFeePercent: getPlanByIdOrDefault(DEFAULT_PLAN_ID).platformFeePercent,
};

export function getFeeSettings(): FeeSettings {
  if (typeof window === "undefined") {
    return DEFAULT_FEE_SETTINGS;
  }

  try {
    const raw = localStorage.getItem(FEE_SETTINGS_STORAGE_KEY);
    const planFee = getPlanByIdOrDefault(getProviderSubscription().planId).platformFeePercent;

    if (!raw) {
      return { ...DEFAULT_FEE_SETTINGS, platformFeePercent: planFee };
    }

    return {
      ...DEFAULT_FEE_SETTINGS,
      ...(JSON.parse(raw) as FeeSettings),
      platformFeePercent: planFee,
    };
  } catch {
    return DEFAULT_FEE_SETTINGS;
  }
}

export function saveFeeSettings(settings: FeeSettings): void {
  const planFee = getPlanByIdOrDefault(getProviderSubscription().planId).platformFeePercent;
  localStorage.setItem(
    FEE_SETTINGS_STORAGE_KEY,
    JSON.stringify({
      ...settings,
      platformFeePercent: planFee,
    }),
  );
}

export const feeHandlingLabels: Record<FeeHandling, string> = {
  provider_absorbs: "Club absorbs fee",
  fees_on_top: "Parent pays fee",
  split_fee: "Split fee",
};

export const feeHandlingDescriptions: Record<FeeHandling, string> = {
  provider_absorbs:
    "Platform and Stripe fees are deducted from your payout. Parents pay the listed session price.",
  fees_on_top:
    "Platform and Stripe fees are added on top of the session price. Parents pay the full amount including fees.",
  split_fee:
    "Platform and Stripe fees are shared equally between the club and the parent.",
};
