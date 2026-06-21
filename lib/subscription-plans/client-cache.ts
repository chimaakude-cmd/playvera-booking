import {
  DEFAULT_SUBSCRIPTION_PLANS,
  getDefaultPlanBySlug,
  legacyIdToPlanSlug,
  normalizePlanSlug,
} from "./defaults";
import type { PlanSlug, SubscriptionPlan } from "./types";

let cachedPlans: SubscriptionPlan[] | null = null;
let hydratePromise: Promise<SubscriptionPlan[]> | null = null;

export function getCachedSubscriptionPlans(): SubscriptionPlan[] {
  return cachedPlans ?? DEFAULT_SUBSCRIPTION_PLANS;
}

export function getCachedSubscriptionPlanBySlug(
  slug: string | null | undefined,
): SubscriptionPlan {
  const normalized = normalizePlanSlug(slug);
  return (
    getCachedSubscriptionPlans().find((plan) => plan.slug === normalized) ??
    getDefaultPlanBySlug(normalized)
  );
}

export function getCachedSubscriptionPlanByLegacyId(
  planId: string | null | undefined,
): SubscriptionPlan {
  return getCachedSubscriptionPlanBySlug(legacyIdToPlanSlug(planId));
}

export function getCachedBookingFeeForPlan(planRef: string | null | undefined): number {
  return getCachedSubscriptionPlanByLegacyId(planRef).bookingFeePercent;
}

export async function hydrateSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  if (cachedPlans) {
    return cachedPlans;
  }

  if (hydratePromise) {
    return hydratePromise;
  }

  hydratePromise = (async () => {
    try {
      const response = await fetch("/api/subscription-plans/public", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load subscription plans.");
      }

      const data = (await response.json()) as { plans: SubscriptionPlan[] };
      cachedPlans = data.plans?.length ? data.plans : DEFAULT_SUBSCRIPTION_PLANS;
      return cachedPlans;
    } catch {
      cachedPlans = DEFAULT_SUBSCRIPTION_PLANS;
      return cachedPlans;
    } finally {
      hydratePromise = null;
    }
  })();

  return hydratePromise;
}

export function invalidateSubscriptionPlansCache(): void {
  cachedPlans = null;
  hydratePromise = null;
}

export function findPlanBySlug(plans: SubscriptionPlan[], slug: PlanSlug): SubscriptionPlan {
  return plans.find((plan) => plan.slug === slug) ?? getDefaultPlanBySlug(slug);
}
