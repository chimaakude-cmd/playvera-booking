/**
 * Club fee settings persistence (localStorage).
 *
 * Storage keys:
 * - activora-fee-settings — per-club fee handling
 *
 * Platform fee tiers are loaded from `/api/platform-settings/public` (see client-cache).
 *
 * Supabase migration:
 * - Table: public.club_settings
 * - Access via: dataLayer.feeSettings
 */
import {
  getCachedPlatformFeeMatrix,
  getCachedPlatformPublicSettings,
  hydratePlatformPublicSettings,
} from "@/lib/platform-settings/client-cache";
import {
  DEFAULT_PLAN_ID,
  getAllPlans,
  getPlanByIdOrDefault,
  type PlanId,
} from "@/src/config/pricing";
import { getProviderSubscription } from "@/lib/provider-subscription";

export const MIN_PLATFORM_FEE_PERCENT = 0;
export const MAX_PLATFORM_FEE_PERCENT = 10;

export type PlatformFeeMatrix = Record<PlanId, number>;

export type PlatformFeeTier = {
  planId: PlanId;
  label: string;
  description: string;
};

export const PLATFORM_FEE_TIERS: PlatformFeeTier[] = [
  {
    planId: "STARTER",
    label: "Free account",
    description: "Clubs on Free plan (Starter)",
  },
  {
    planId: "PRO",
    label: "Pro account",
    description: "Clubs on Pro plan",
  },
  {
    planId: "FRANCHISE",
    label: "Franchisor",
    description: "Franchisor + all managed clubs",
  },
  {
    planId: "ENTERPRISE",
    label: "Enterprise",
    description: "Enterprise organisations",
  },
];

export function buildDefaultPlatformFeeMatrix(): PlatformFeeMatrix {
  const matrix = {} as PlatformFeeMatrix;
  for (const plan of getAllPlans()) {
    matrix[plan.id] = plan.platformFeePercent;
  }
  return matrix;
}

export const DEFAULT_PLATFORM_FEE_MATRIX = buildDefaultPlatformFeeMatrix();

export function validatePlatformFeePercent(value: number): boolean {
  return (
    Number.isFinite(value) &&
    value >= MIN_PLATFORM_FEE_PERCENT &&
    value <= MAX_PLATFORM_FEE_PERCENT
  );
}

export function validatePlatformFeeMatrix(
  matrix: Partial<PlatformFeeMatrix>,
): matrix is PlatformFeeMatrix {
  return PLATFORM_FEE_TIERS.every((tier) =>
    validatePlatformFeePercent(matrix[tier.planId] ?? NaN),
  );
}

export function getPlatformFeeMatrix(): PlatformFeeMatrix {
  if (typeof window !== "undefined" && !getCachedPlatformPublicSettings()) {
    void hydratePlatformPublicSettings();
  }
  return getCachedPlatformFeeMatrix();
}

export async function hydratePlatformFeeMatrix(): Promise<PlatformFeeMatrix> {
  const settings = await hydratePlatformPublicSettings();
  return settings.defaultFees;
}

export function getPlatformFeeForPlan(
  planId: PlanId | string | null | undefined,
): number {
  const normalized = getPlanByIdOrDefault(planId).id;
  return getPlatformFeeMatrix()[normalized];
}

export function calculatePlatformFeeAmount(
  bookingAmount: number,
  feePercent: number,
): number {
  return Math.round(((bookingAmount * feePercent) / 100) * 100) / 100;
}

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
  platformFeePercent: getPlatformFeeForPlan(DEFAULT_PLAN_ID),
};

export function getFeeSettings(): FeeSettings {
  if (typeof window === "undefined") {
    return DEFAULT_FEE_SETTINGS;
  }

  try {
    const raw = localStorage.getItem(FEE_SETTINGS_STORAGE_KEY);
    const planFee = getPlatformFeeForPlan(getProviderSubscription().planId);

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
  const planFee = getPlatformFeeForPlan(getProviderSubscription().planId);
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
