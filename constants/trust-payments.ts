import { FREE_TIER_FEE_PERCENT } from "@/constants/commission-tiers";
import { estimateGoCardlessFee } from "@/lib/gocardless/fees";
import { estimateStripeFee } from "@/lib/payments";

export const TRUST_EXAMPLE_BOOKING_AMOUNT = 10;

export const STRIPE_UK_FEE_ESTIMATES = [
  {
    label: "Standard UK cards",
    rate: "around 1.5% + 20p per transaction",
  },
  {
    label: "Premium UK cards",
    rate: "around 1.9% + 20p per transaction",
  },
  {
    label: "International cards",
    rate: "may cost more — check Stripe for current rates",
  },
] as const;

export const GOCARDLESS_FEE_ESTIMATE =
  "GoCardless typically charges a percentage plus a fixed fee per collection. Exact rates depend on your GoCardless plan and payment type.";

export const TRUST_FEE_DISCLAIMER =
  "Fee rates are estimates for illustration only. Stripe, GoCardless and Activora may change their fees. Always check your provider dashboard and plan for current pricing.";

export const DEFAULT_PLATFORM_FEE_PERCENT = FREE_TIER_FEE_PERCENT;

export const TRUST_PLATFORM_FEE_NOTE = `Activora charges a standard platform fee of 2.5% per transaction. Stripe and GoCardless may charge separate payment processing fees.`;

/** User-facing platform fee copy when a resolved percent is available (e.g. from config). */
export function formatPlatformFeeNote(
  platformFeePercent: number = DEFAULT_PLATFORM_FEE_PERCENT,
): string {
  return `Activora charges a platform fee of ${platformFeePercent}% per transaction. Stripe and GoCardless may charge separate payment processing fees.`;
}

export const stripeTrustExample = {
  bookingAmount: TRUST_EXAMPLE_BOOKING_AMOUNT,
  activoraFeePercent: FREE_TIER_FEE_PERCENT,
  estimatedProcessorFeeLabel: "Estimated Stripe processing fee",
  estimatedProcessorFeeAmount: estimateStripeFee(TRUST_EXAMPLE_BOOKING_AMOUNT),
  providerReceivesLabel: "Estimated provider receives (before adjustments)",
};

export const gocardlessTrustExample = {
  bookingAmount: TRUST_EXAMPLE_BOOKING_AMOUNT,
  activoraFeePercent: FREE_TIER_FEE_PERCENT,
  estimatedProcessorFeeLabel: "Estimated GoCardless processing fee",
  estimatedProcessorFeeAmount: estimateGoCardlessFee(TRUST_EXAMPLE_BOOKING_AMOUNT),
  providerReceivesLabel: "Estimated provider receives (before adjustments)",
};
