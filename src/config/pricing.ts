/**
 * Pricing facade — reads from subscription_plans (DB) via client cache on the
 * browser and DEFAULT_SUBSCRIPTION_PLANS on the server. Do not hardcode limits
 * or fee tiers here; use lib/subscription-plans/capabilities.ts.
 */
import {
  DEFAULT_PLAN_SLUG,
  DEFAULT_SUBSCRIPTION_PLANS,
  getCachedSubscriptionPlans,
  getCachedSubscriptionPlanByLegacyId,
  hydrateSubscriptionPlans,
  legacyIdToPlanSlug,
  normalizePlanSlug,
  planSlugToLegacyId,
  type PlanId,
} from "@/lib/subscription-plans";
import type { PlanSlug, SubscriptionPlan } from "@/lib/subscription-plans/types";
import { subscriptionPlanToPricingShape } from "@/lib/subscription-plans/mappers";

export type { PlanId } from "@/lib/subscription-plans/defaults";

export type PricingPlan = {
  id: PlanId;
  slug: PlanSlug;
  monthlyPrice: number;
  platformFeePercent: number;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
  contactSales: boolean;
  monthlyPriceIsMinimum: boolean;
};

export const DEFAULT_PLAN_ID: PlanId = planSlugToLegacyId(DEFAULT_PLAN_SLUG);

export const PRICING_DISCLAIMER =
  "Payment processor fees (Stripe / GoCardless) apply separately from the platform booking fee.";

function planToPricing(plan: SubscriptionPlan): PricingPlan {
  const shape = subscriptionPlanToPricingShape(plan);
  return {
    id: shape.legacyId as PlanId,
    slug: shape.slug,
    monthlyPrice: shape.monthlyPrice,
    platformFeePercent: shape.platformFeePercent,
    description: shape.description,
    features: shape.features,
    cta: shape.cta,
    highlighted: shape.highlighted,
    contactSales: shape.contactSales,
    monthlyPriceIsMinimum: shape.monthlyPriceIsMinimum,
  };
}

export function getAllPlans(): PricingPlan[] {
  const plans =
    typeof window !== "undefined"
      ? getCachedSubscriptionPlans()
      : DEFAULT_SUBSCRIPTION_PLANS;
  return plans.map(planToPricing);
}

export async function hydratePricingPlans(): Promise<PricingPlan[]> {
  await hydrateSubscriptionPlans();
  return getAllPlans();
}

export function getPlanBySlug(slug: string | null | undefined): PricingPlan | undefined {
  const normalized = normalizePlanSlug(slug);
  const plans =
    typeof window !== "undefined"
      ? getCachedSubscriptionPlans()
      : DEFAULT_SUBSCRIPTION_PLANS;
  const match = plans.find((plan) => plan.slug === normalized);
  return match ? planToPricing(match) : undefined;
}

export function getPlanById(planId: PlanId): PricingPlan | undefined {
  const plan = getCachedSubscriptionPlanByLegacyId(planId);
  return plan ? planToPricing(plan) : undefined;
}

export function getPlanByIdOrDefault(planId: PlanId | string | null | undefined): PricingPlan {
  const slug = legacyIdToPlanSlug(String(planId ?? DEFAULT_PLAN_ID));
  const plan =
    (typeof window !== "undefined"
      ? getCachedSubscriptionPlans()
      : DEFAULT_SUBSCRIPTION_PLANS
    ).find((item) => item.slug === slug) ??
    DEFAULT_SUBSCRIPTION_PLANS.find((item) => item.slug === slug)!;

  return planToPricing(plan);
}

export function normalizePlanId(value: PlanId | string | null | undefined): PlanId {
  return planSlugToLegacyId(normalizePlanSlug(value));
}

export function formatMonthlyPrice(
  plan: Pick<PricingPlan, "monthlyPrice" | "contactSales" | "monthlyPriceIsMinimum">,
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

export function formatPlatformFee(
  plan: Pick<PricingPlan, "platformFeePercent">,
): string {
  return `${plan.platformFeePercent}%`;
}

export function planRequiresGoCardlessBilling(
  planId: PlanId | string | null | undefined,
): boolean {
  const plan = getPlanByIdOrDefault(planId);
  return !plan.contactSales && plan.monthlyPrice > 0;
}

export function getPlanLabel(planId: PlanId | string | null | undefined): string {
  const slug = legacyIdToPlanSlug(String(planId));
  const plans =
    typeof window !== "undefined"
      ? getCachedSubscriptionPlans()
      : DEFAULT_SUBSCRIPTION_PLANS;
  return plans.find((plan) => plan.slug === slug)?.displayName ?? "Free";
}

export function getSubscriptionPlanForLegacyId(
  planId: PlanId | string | null | undefined,
): SubscriptionPlan {
  return getCachedSubscriptionPlanByLegacyId(planId);
}
