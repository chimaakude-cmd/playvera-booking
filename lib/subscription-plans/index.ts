import type { SubscriptionPlan } from "./types";

export type {
  PlanCapabilities,
  PlanFeatureFlags,
  PlanSlug,
  PlanUsageContext,
  SubscriptionPlan,
  SubscriptionPlanUpdate,
  SupportLevel,
} from "./types";

export {
  DEFAULT_PLAN_SLUG,
  DEFAULT_SUBSCRIPTION_PLANS,
  getDefaultPlanBySlug,
  legacyIdToPlanSlug,
  normalizePlanSlug,
  planSlugToLegacyId,
  type PlanId,
} from "./defaults";

export {
  getPlanCapabilities,
  getPlanLimitReason,
  getSuggestedUpgradeSlug,
  type PlanLimitReason,
} from "./capabilities";

export {
  getCachedBookingFeeForPlan,
  getCachedSubscriptionPlanByLegacyId,
  getCachedSubscriptionPlanBySlug,
  getCachedSubscriptionPlans,
  hydrateSubscriptionPlans,
  invalidateSubscriptionPlansCache,
} from "./client-cache";

export {
  getServerBookingFeeForPlan,
  getServerSubscriptionPlanBySlug,
  getServerSubscriptionPlans,
  SubscriptionPlansStoreError,
  updateServerSubscriptionPlan,
} from "./server-store";

export { subscriptionPlanToPricingShape } from "./mappers";

export function formatPlanMonthlyPrice(
  plan: Pick<SubscriptionPlan, "monthlyPrice" | "monthlyPriceIsMinimum" | "contactSales">,
): string {
  if (plan.contactSales || plan.monthlyPriceIsMinimum) {
    return `£${plan.monthlyPrice.toLocaleString("en-GB")}+`;
  }

  if (plan.monthlyPrice === 0) {
    return "Free";
  }

  return `£${plan.monthlyPrice.toLocaleString("en-GB", {
    minimumFractionDigits: plan.monthlyPrice % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}/mo`;
}

export function formatPlanBookingFee(
  plan: Pick<SubscriptionPlan, "bookingFeePercent">,
): string {
  return `${plan.bookingFeePercent}%`;
}

export function planRequiresGoCardlessBilling(plan: SubscriptionPlan): boolean {
  return !plan.contactSales && plan.monthlyPrice > 0;
}
