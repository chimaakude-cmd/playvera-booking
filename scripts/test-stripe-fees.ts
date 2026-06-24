/**
 * Stripe Connect payout breakdown and platform fee resolution tests.
 * Run: npx tsx scripts/test-stripe-fees.ts
 */

import {
  PLATFORM_FEE_PERCENT,
  STRIPE_FEE_FIXED,
  STRIPE_FEE_PERCENT,
  calculateStripeConnectPayoutBreakdown,
} from "../lib/payments";
import {
  calculateApplicationFeePence,
  resolvePlatformFeePercentFromInputs,
} from "../lib/stripe/platform-fee";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function approx(actual: number, expected: number, message: string) {
  assert(Math.abs(actual - expected) < 0.01, `${message} (got ${actual}, expected ${expected})`);
}

// --- Connect payout breakdown (£50 @ default platform fee) ---

const gross = 50;
const breakdown = calculateStripeConnectPayoutBreakdown(gross);

approx(breakdown.customerPayment, 50, "Customer payment");
approx(breakdown.platformFeePercent, PLATFORM_FEE_PERCENT, "Platform fee percent");
approx(
  breakdown.activoraPlatformFee,
  Math.round(gross * PLATFORM_FEE_PERCENT) / 100,
  "Activora platform fee on £50",
);

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

// --- Fee resolution order ---

const overrideResolved = resolvePlatformFeePercentFromInputs({
  overridePercent: 1.25,
  planBookingFeePercent: 2,
  providerPlatformFeePercent: 2.5,
  platformConfigPercent: 2.5,
});
assert(overrideResolved.source === "override", "Override wins");
approx(overrideResolved.platformFeePercent, 1.25, "Override percent");

const planResolved = resolvePlatformFeePercentFromInputs({
  overridePercent: null,
  planBookingFeePercent: 2,
  providerPlatformFeePercent: 2.5,
  platformConfigPercent: 2.5,
});
assert(planResolved.source === "plan", "Plan tier wins over provider default");
approx(planResolved.platformFeePercent, 2, "Pro plan fee");

const providerResolved = resolvePlatformFeePercentFromInputs({
  overridePercent: null,
  planBookingFeePercent: null,
  providerPlatformFeePercent: 2.5,
  platformConfigPercent: 2,
});
assert(providerResolved.source === "provider", "Provider default used");
approx(providerResolved.platformFeePercent, 2.5, "Provider percent");

// --- £10 booking application fee (Pro 2%) ---

const tenPoundList = 10;
const proFeePercent = 2;
const applicationFeePence = calculateApplicationFeePence(tenPoundList, proFeePercent);
assert(applicationFeePence === 20, "£10 @ 2% → 20p application fee");

const tenPoundBreakdown = calculateStripeConnectPayoutBreakdown(
  tenPoundList,
  proFeePercent,
);
approx(tenPoundBreakdown.activoraPlatformFee, 0.2, "£10 Activora fee £0.20");
approx(tenPoundBreakdown.customerPayment, 10, "£10 parent charge");

console.log("All Stripe fee breakdown tests passed.");
console.log(
  JSON.stringify(
    {
      gross,
      tenPoundPro: {
        parentCharge: tenPoundBreakdown.customerPayment,
        applicationFeePence,
        activoraPlatformFee: tenPoundBreakdown.activoraPlatformFee,
        stripeProcessingFee: tenPoundBreakdown.stripeProcessingFee,
        providerPayout: tenPoundBreakdown.providerPayout,
      },
      stripePercent: STRIPE_FEE_PERCENT,
      stripeFixed: STRIPE_FEE_FIXED,
      breakdown,
    },
    null,
    2,
  ),
);
