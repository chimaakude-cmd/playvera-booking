export type CommissionTier = {
  plan: string;
  monthlyPrice: string;
  platformFeePercent: number;
  description: string;
};

export const COMMISSION_TIERS: CommissionTier[] = [
  {
    plan: "Free",
    monthlyPrice: "£0",
    platformFeePercent: 2.5,
    description: "Everything you need to start taking bookings online.",
  },
  {
    plan: "Pro",
    monthlyPrice: "£24.99/mo",
    platformFeePercent: 2,
    description: "Unlimited activities and priority support for growing clubs.",
  },
  {
    plan: "Franchisor",
    monthlyPrice: "Custom",
    platformFeePercent: 1.5,
    description: "Multi-location management for franchise operators.",
  },
  {
    plan: "Enterprise",
    monthlyPrice: "Custom",
    platformFeePercent: 1,
    description: "Dedicated support and advanced controls at scale.",
  },
];

export const FREE_TIER_FEE_PERCENT = 2.5;
