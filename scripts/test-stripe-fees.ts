/**
 * Stripe Connect payout breakdown tests.
 * Run: npx tsx scripts/test-stripe-fees.ts
 */

import {
  PLATFORM_FEE_PERCENT,
  STRIPE_FEE_FIXED,
  STRIPE_FEE_PERCENT,
  calculateStripeConnectPayoutBreakdown,
} from "../lib/payments";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function approx(actual: number, expected: number, message: string) {
  assert(Math.abs(actual - expected) < 0.01, `${message} (got ${actual}, expected ${expected})`);
}

const gross = 50;
const breakdown = calculateStripeConnectPayoutBreakdown(gross);

approx(breakdown.customerPayment, 50, "Customer payment");
approx(breakdown.platformFeePercent, PLATFORM_FEE_PERCENT, "Platform fee percent");
approx(breakdown.activoraPlatformFee, 1, "Activora 2% platform fee on £50");

const expectedStripe =
  Math.round(((gross * STRIPE_FEE_PERCENT) / 100 + STRIPE_FEE_FIXED) * 100) /
  100;
approx(breakdown.stripeProcessingFee, expectedStripe, "Stripe processing fee");

approx(
  breakdown.providerPayout,
  breakdown.customerPayment -
    breakdown.activoraPlatformFee -
    breakdown.stripeProcessingFee,
  "Provider payout amount",
);

assert(
  breakdown.providerPayout ===
    Math.round(
      (breakdown.customerPayment -
        breakdown.activoraPlatformFee -
        breakdown.stripeProcessingFee) *
        100,
    ) / 100,
  "Provider payout is customer payment minus both fees",
);

console.log("All Stripe fee breakdown tests passed.");
console.log(
  JSON.stringify(
    {
      gross,
      stripePercent: STRIPE_FEE_PERCENT,
      stripeFixed: STRIPE_FEE_FIXED,
      breakdown,
    },
    null,
    2,
  ),
);
