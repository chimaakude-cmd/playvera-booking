import type { PlanSlug, SubscriptionPlan } from "./types";

export const DEFAULT_PLAN_SLUG: PlanSlug = "FREE";

export const DEFAULT_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "seed-free",
    slug: "FREE",
    displayName: "Free",
    description: "Everything you need to start taking bookings online.",
    monthlyPrice: 0,
    monthlyPriceIsMinimum: false,
    bookingFeePercent: 2.5,
    activityLimit: 20,
    clubLimit: null,
    supportLevel: "standard",
    dedicatedManager: false,
    quarterlyCallsEnabled: false,
    earlyAccessEnabled: false,
    unlimitedActivities: false,
    unlimitedClubs: false,
    enabled: true,
    sortOrder: 1,
    responseTargetHours: null,
    prioritySupport: false,
    urgentSupport: false,
    features: [
      "Online bookings",
      "Public profile & widget",
      "Payments & basic reporting",
      "Standard support",
      "Staff permissions",
      "Up to 20 activities",
    ],
    cta: "Get started free",
    highlighted: false,
    contactSales: false,
  },
  {
    id: "seed-pro",
    slug: "PRO",
    displayName: "Pro",
    description: "Unlimited activities and priority support for growing clubs.",
    monthlyPrice: 19.99,
    monthlyPriceIsMinimum: false,
    bookingFeePercent: 2,
    activityLimit: null,
    clubLimit: null,
    supportLevel: "priority",
    dedicatedManager: false,
    quarterlyCallsEnabled: true,
    earlyAccessEnabled: true,
    unlimitedActivities: true,
    unlimitedClubs: false,
    enabled: true,
    sortOrder: 2,
    responseTargetHours: null,
    prioritySupport: true,
    urgentSupport: false,
    features: [
      "Unlimited activities",
      "Priority support",
      "Enhanced reporting",
      "Expanded admin tools",
      "Early feature access",
      "Quarterly strategy calls",
      "Unlimited staff",
    ],
    cta: "Start Pro trial",
    highlighted: true,
    contactSales: false,
  },
  {
    id: "seed-franchisor",
    slug: "FRANCHISOR",
    displayName: "Franchisor",
    description: "Multi-location management for franchise operators.",
    monthlyPrice: 149,
    monthlyPriceIsMinimum: false,
    bookingFeePercent: 1.5,
    activityLimit: null,
    clubLimit: 25,
    supportLevel: "urgent",
    dedicatedManager: true,
    quarterlyCallsEnabled: true,
    earlyAccessEnabled: true,
    unlimitedActivities: true,
    unlimitedClubs: false,
    enabled: true,
    sortOrder: 3,
    responseTargetHours: null,
    prioritySupport: false,
    urgentSupport: true,
    features: [
      "Franchise dashboard",
      "Central reporting",
      "Up to 25 managed clubs",
      "Dedicated account manager",
      "Urgent support",
      "Quarterly strategy calls",
      "Early feature access",
    ],
    cta: "Choose Franchisor",
    highlighted: false,
    contactSales: false,
  },
  {
    id: "seed-enterprise",
    slug: "ENTERPRISE",
    displayName: "Enterprise",
    description: "Dedicated support and advanced controls at scale.",
    monthlyPrice: 499,
    monthlyPriceIsMinimum: true,
    bookingFeePercent: 1,
    activityLimit: null,
    clubLimit: null,
    supportLevel: "urgent",
    dedicatedManager: true,
    quarterlyCallsEnabled: true,
    earlyAccessEnabled: true,
    unlimitedActivities: true,
    unlimitedClubs: true,
    enabled: true,
    sortOrder: 4,
    responseTargetHours: 6,
    prioritySupport: false,
    urgentSupport: true,
    features: [
      "Unlimited clubs",
      "Dedicated account manager",
      "6-hour response target",
      "Enterprise reporting",
      "Bulk import tools",
      "Quarterly strategy calls",
      "Early feature access",
    ],
    cta: "Contact sales",
    highlighted: false,
    contactSales: true,
  },
];

export function getDefaultPlanBySlug(slug: string | null | undefined): SubscriptionPlan {
  const normalized = normalizePlanSlug(slug);
  return (
    DEFAULT_SUBSCRIPTION_PLANS.find((plan) => plan.slug === normalized) ??
    DEFAULT_SUBSCRIPTION_PLANS[0]
  );
}

export function normalizePlanSlug(value: string | null | undefined): PlanSlug {
  if (!value) {
    return DEFAULT_PLAN_SLUG;
  }

  const upper = String(value).toUpperCase();

  const legacyMap: Record<string, PlanSlug> = {
    STARTER: "FREE",
    FREE: "FREE",
    PRO: "PRO",
    GROWTH: "PRO",
    FRANCHISE: "FRANCHISOR",
    FRANCHISOR: "FRANCHISOR",
    ENTERPRISE: "ENTERPRISE",
  };

  return legacyMap[upper] ?? DEFAULT_PLAN_SLUG;
}

/** Legacy PlanId used across provider_subscriptions and UI. */
export type PlanId = "STARTER" | "PRO" | "FRANCHISE" | "ENTERPRISE";

export function planSlugToLegacyId(slug: PlanSlug): PlanId {
  const map: Record<PlanSlug, PlanId> = {
    FREE: "STARTER",
    PRO: "PRO",
    FRANCHISOR: "FRANCHISE",
    ENTERPRISE: "ENTERPRISE",
  };
  return map[slug];
}

export function legacyIdToPlanSlug(planId: string | null | undefined): PlanSlug {
  const upper = String(planId ?? "").toUpperCase();
  const map: Record<string, PlanSlug> = {
    STARTER: "FREE",
    FREE: "FREE",
    PRO: "PRO",
    GROWTH: "PRO",
    FRANCHISE: "FRANCHISOR",
    FRANCHISOR: "FRANCHISOR",
    ENTERPRISE: "ENTERPRISE",
  };
  return map[upper] ?? DEFAULT_PLAN_SLUG;
}
