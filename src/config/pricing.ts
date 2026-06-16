export type PlanId = "STARTER" | "PRO" | "FRANCHISE" | "ENTERPRISE";

export type PricingPlan = {
  id: PlanId;
  monthlyPrice: number;
  platformFeePercent: number;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
  contactSales: boolean;
};

export const MIN_ENTERPRISE_PLATFORM_FEE = 1;

export const DEFAULT_PLAN_ID: PlanId = "STARTER";

export const PRICING_DISCLAIMER =
  "Payment processor fees may apply separately.";

const PLANS: PricingPlan[] = [
  {
    id: "STARTER",
    monthlyPrice: 0,
    platformFeePercent: 2.5,
    description: "Everything you need to start taking bookings online.",
    features: [
      "Online bookings",
      "Parent dashboard",
      "Session creation",
      "Standard support",
    ],
    cta: "Get started free",
    highlighted: false,
    contactSales: false,
  },
  {
    id: "PRO",
    monthlyPrice: 19.99,
    platformFeePercent: 2.0,
    description: "Lower platform fees and tools for growing clubs.",
    features: [
      "Everything in Starter",
      "Reduced platform fee",
      "Priority support",
      "Bank transfer payout options",
      "Enhanced reporting",
      "Limited staff accounts",
    ],
    cta: "Start Pro trial",
    highlighted: true,
    contactSales: false,
  },
  {
    id: "FRANCHISE",
    monthlyPrice: 149,
    platformFeePercent: 1.5,
    description: "Multi-location management for franchise operators.",
    features: [
      "Multi-location management",
      "Franchise dashboard",
      "Unlimited staff accounts",
      "Central reporting",
      "Revenue split support",
      "White-label email",
    ],
    cta: "Choose Franchise",
    highlighted: false,
    contactSales: false,
  },
  {
    id: "ENTERPRISE",
    monthlyPrice: 499,
    platformFeePercent: 1.0,
    description: "Dedicated support and advanced controls at scale.",
    features: [
      "Dedicated onboarding",
      "Advanced reporting",
      "Priority support",
      "Bulk import",
      "Account management",
    ],
    cta: "Contact sales",
    highlighted: false,
    contactSales: true,
  },
];

export function getAllPlans(): PricingPlan[] {
  return PLANS;
}

export function getPlanById(planId: PlanId): PricingPlan | undefined {
  return PLANS.find((plan) => plan.id === planId);
}

export function getPlanByIdOrDefault(planId: PlanId | string | null | undefined): PricingPlan {
  const normalized = normalizePlanId(planId);
  return getPlanById(normalized) ?? getPlanById(DEFAULT_PLAN_ID)!;
}

export function normalizePlanId(value: PlanId | string | null | undefined): PlanId {
  if (!value) {
    return DEFAULT_PLAN_ID;
  }

  const upper = String(value).toUpperCase();

  if (upper === "STARTER" || upper === "PRO" || upper === "FRANCHISE" || upper === "ENTERPRISE") {
    return upper;
  }

  // Legacy club-team plan ids
  const legacyMap: Record<string, PlanId> = {
    GROWTH: "PRO",
  };

  return legacyMap[upper] ?? DEFAULT_PLAN_ID;
}

export function formatMonthlyPrice(plan: Pick<PricingPlan, "monthlyPrice" | "contactSales">): string {
  if (plan.contactSales) {
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

export function formatPlatformFee(plan: Pick<PricingPlan, "platformFeePercent" | "contactSales">): string {
  const suffix = plan.contactSales ? " minimum" : "";
  return `${plan.platformFeePercent}%${suffix}`;
}

export function validatePlatformFee(planId: PlanId, fee: number): boolean {
  if (planId === "ENTERPRISE") {
    return fee >= MIN_ENTERPRISE_PLATFORM_FEE;
  }

  return fee >= 0;
}

/** Pro and Franchise are billed monthly via GoCardless Direct Debit. */
export function planRequiresGoCardlessBilling(planId: PlanId | string | null | undefined): boolean {
  const plan = getPlanByIdOrDefault(planId);
  return !plan.contactSales && plan.monthlyPrice > 0;
}

export function getPlanLabel(planId: PlanId): string {
  const labels: Record<PlanId, string> = {
    STARTER: "Starter",
    PRO: "Pro",
    FRANCHISE: "Franchise",
    ENTERPRISE: "Enterprise",
  };

  return labels[normalizePlanId(planId)];
}
