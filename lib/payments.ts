export type { FeeHandling } from "./fee-settings";
import type { FeeHandling } from "./fee-settings";
import { DEFAULT_PLAN_ID, getPlanByIdOrDefault } from "@/src/config/pricing";
import { getProviderPlatformFeePercent } from "@/lib/provider-subscription";

/** Default platform fee for Starter plan (server-side fallback). */
export const PLATFORM_FEE_PERCENT =
  getPlanByIdOrDefault(DEFAULT_PLAN_ID).platformFeePercent;

export function resolvePlatformFeePercent(override?: number | null): number {
  if (override != null && Number.isFinite(override)) {
    return override;
  }

  if (typeof window !== "undefined") {
    return getProviderPlatformFeePercent();
  }

  return PLATFORM_FEE_PERCENT;
}

/** UK card estimate: 1.5% + £0.20 (placeholder until Stripe is integrated) */
export const STRIPE_FEE_PERCENT = 1.5;
export const STRIPE_FEE_FIXED = 0.2;

export type PaymentBreakdown = {
  listPrice: number;
  customerPrice: number;
  platformFeePercent: number;
  platformFee: number;
  estimatedStripeFee: number;
  estimatedProviderPayout: number;
  feeHandling: FeeHandling;
};

/** Stripe Connect payout view shown in Finance dashboard */
export type StripeConnectPayoutBreakdown = {
  customerPayment: number;
  stripeProcessingFee: number;
  activoraPlatformFee: number;
  providerPayout: number;
  platformFeePercent: number;
  /** @deprecated use customerPayment */
  grossBookingValue: number;
  /** @deprecated use providerPayout */
  netProviderAmount: number;
};

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function estimateStripeFee(chargeAmount: number): number {
  return roundMoney(
    (chargeAmount * STRIPE_FEE_PERCENT) / 100 + STRIPE_FEE_FIXED,
  );
}

/**
 * Standard Connect split: parent pays gross, Stripe fee + Activora 2% deducted,
 * provider receives the remainder.
 */
export function calculateStripeConnectPayoutBreakdown(
  customerPayment: number,
  platformFeePercent: number = PLATFORM_FEE_PERCENT,
): StripeConnectPayoutBreakdown {
  const activoraPlatformFee = roundMoney(
    (customerPayment * platformFeePercent) / 100,
  );
  const stripeProcessingFee = estimateStripeFee(customerPayment);
  const providerPayout = roundMoney(
    Math.max(0, customerPayment - activoraPlatformFee - stripeProcessingFee),
  );

  return {
    customerPayment,
    stripeProcessingFee,
    activoraPlatformFee,
    providerPayout,
    platformFeePercent,
    grossBookingValue: customerPayment,
    netProviderAmount: providerPayout,
  };
}

export function calculatePaymentBreakdown(
  listPrice: number,
  platformFeePercent: number = PLATFORM_FEE_PERCENT,
  feeHandling: FeeHandling = "provider_absorbs",
): PaymentBreakdown {
  const platformFee = roundMoney((listPrice * platformFeePercent) / 100);

  if (feeHandling === "fees_on_top") {
    const chargeBeforeStripe = listPrice + platformFee;
    const estimatedStripeFee = estimateStripeFee(chargeBeforeStripe);
    const customerPrice = roundMoney(chargeBeforeStripe + estimatedStripeFee);

    return {
      listPrice,
      customerPrice,
      platformFeePercent,
      platformFee,
      estimatedStripeFee,
      estimatedProviderPayout: listPrice,
      feeHandling,
    };
  }

  if (feeHandling === "split_fee") {
    const estimatedStripeFeeFull = estimateStripeFee(listPrice);
    const totalFees = roundMoney(platformFee + estimatedStripeFeeFull);
    const parentShare = roundMoney(totalFees / 2);
    const clubShare = roundMoney(totalFees - parentShare);
    const customerPrice = roundMoney(listPrice + parentShare);
    const estimatedStripeFee = estimateStripeFee(customerPrice);
    const estimatedProviderPayout = roundMoney(
      listPrice - clubShare - (estimatedStripeFee - estimatedStripeFeeFull / 2),
    );

    return {
      listPrice,
      customerPrice,
      platformFeePercent,
      platformFee: clubShare,
      estimatedStripeFee,
      estimatedProviderPayout: Math.max(0, estimatedProviderPayout),
      feeHandling,
    };
  }

  const customerPrice = listPrice;
  const estimatedStripeFee = estimateStripeFee(customerPrice);
  const estimatedProviderPayout = roundMoney(
    customerPrice - platformFee - estimatedStripeFee,
  );

  return {
    listPrice,
    customerPrice,
    platformFeePercent,
    platformFee,
    estimatedStripeFee,
    estimatedProviderPayout: Math.max(0, estimatedProviderPayout),
    feeHandling,
  };
}

export function getCustomerPrice(
  listPrice: number,
  platformFeePercent?: number,
  feeHandling?: FeeHandling,
): number {
  return calculatePaymentBreakdown(
    listPrice,
    platformFeePercent,
    feeHandling,
  ).customerPrice;
}

export function formatMoney(amount: number): string {
  return `£${amount.toFixed(2)}`;
}
