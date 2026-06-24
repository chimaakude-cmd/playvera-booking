/**
 * Platform booking fee resolution — backed by subscription_plans tier fees.
 */
import {
  DEFAULT_PLAN_SLUG,
  getCachedBookingFeeForPlan,
  getCachedSubscriptionPlanByLegacyId,
  hydrateSubscriptionPlans,
  legacyIdToPlanSlug,
  normalizePlanSlug,
  type PlanId,
} from "@/lib/subscription-plans";
import { getProviderSubscription } from "@/lib/provider-subscription";

export const UNIVERSAL_BOOKING_FEE_PERCENT = 2.5;

export const MIN_PLATFORM_FEE_PERCENT = 0;
export const MAX_PLATFORM_FEE_PERCENT = 10;

export type FeeHandling =
  | "provider_absorbs"
  | "fees_on_top"
  | "split_fee";

export type FeeSettings = {
  feeHandling: FeeHandling;
  platformFeePercent: number;
};

export const FEE_SETTINGS_STORAGE_KEY = "activora-fee-settings";

export function getPlatformFeeForPlan(
  planId: PlanId | string | null | undefined,
): number {
  if (typeof window !== "undefined") {
    return getCachedBookingFeeForPlan(planId);
  }

  const plan = getCachedSubscriptionPlanByLegacyId(planId);
  return plan.bookingFeePercent;
}

export function calculatePlatformFeeAmount(
  bookingAmount: number,
  feePercent: number,
): number {
  return Math.round(((bookingAmount * feePercent) / 100) * 100) / 100;
}

export const DEFAULT_FEE_SETTINGS: FeeSettings = {
  feeHandling: "provider_absorbs",
  platformFeePercent: UNIVERSAL_BOOKING_FEE_PERCENT,
};

export async function hydratePlatformFeeSettings(): Promise<number> {
  await hydrateSubscriptionPlans();
  return getPlatformFeeForPlan(DEFAULT_PLAN_SLUG);
}

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
    "Platform and payment processor fees are deducted from your payout. Parents pay the listed session price.",
  fees_on_top:
    "Platform and payment processor fees are added on top of the session price. Parents pay the full amount including fees.",
  split_fee:
    "Platform and payment processor fees are shared equally between the club and the parent.",
};

/** @deprecated Use subscription_plans via getPlatformFeeForPlan */
export type PlatformFeeMatrix = Record<PlanId, number>;

/** @deprecated All plans share one booking fee — kept for platform_settings compat */
export function buildDefaultPlatformFeeMatrix(): PlatformFeeMatrix {
  return {
    STARTER: 2.5,
    PRO: 2,
    FRANCHISE: 1.5,
    ENTERPRISE: 1,
  };
}

export const DEFAULT_PLATFORM_FEE_MATRIX = buildDefaultPlatformFeeMatrix();

/** @deprecated */
export const PLATFORM_FEE_TIERS = [
  { planId: "STARTER" as PlanId, label: "All plans", description: "Universal booking fee" },
];

/** @deprecated */
export function validatePlatformFeePercent(value: number): boolean {
  return (
    Number.isFinite(value) &&
    value >= MIN_PLATFORM_FEE_PERCENT &&
    value <= MAX_PLATFORM_FEE_PERCENT
  );
}

/** @deprecated Prefer subscription_plans — kept for platform_settings compat */
export function validatePlatformFeeMatrix(
  matrix?: Partial<PlatformFeeMatrix>,
): matrix is PlatformFeeMatrix {
  if (!matrix) {
    return false;
  }
  const keys: PlanId[] = ["STARTER", "PRO", "FRANCHISE", "ENTERPRISE"];
  return keys.every((key) => validatePlatformFeePercent(matrix[key] ?? NaN));
}

/** @deprecated */
export function getPlatformFeeMatrix(): PlatformFeeMatrix {
  return DEFAULT_PLATFORM_FEE_MATRIX;
}

/** @deprecated */
export async function hydratePlatformFeeMatrix(): Promise<PlatformFeeMatrix> {
  await hydrateSubscriptionPlans();
  return DEFAULT_PLATFORM_FEE_MATRIX;
}

export function resolvePlanSlug(planRef: string | null | undefined): string {
  return legacyIdToPlanSlug(planRef);
}

export function normalizePlanSlugRef(value: string | null | undefined): string {
  return normalizePlanSlug(value);
}
