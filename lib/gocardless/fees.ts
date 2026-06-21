import { PLATFORM_FEE_PERCENT } from "@/lib/payments";

/** Mock UK Direct Debit fee: 1% + £0.20 (placeholder until GoCardless API integrated) */
export const GOCARDLESS_FEE_PERCENT = 1;
export const GOCARDLESS_FEE_FIXED = 0.2;

export type GoCardlessPayoutBreakdown = {
  customerPayment: number;
  gocardlessProcessingFee: number;
  activoraPlatformFee: number;
  providerPayout: number;
  platformFeePercent: number;
};

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function estimateGoCardlessFee(chargeAmount: number): number {
  return roundMoney(
    (chargeAmount * GOCARDLESS_FEE_PERCENT) / 100 + GOCARDLESS_FEE_FIXED,
  );
}

/**
 * Direct Debit split: customer payment minus GoCardless processing fee minus Activora platform fee (default 2.5%),
 * remainder to provider.
 */
export function calculateGoCardlessPayoutBreakdown(
  customerPayment: number,
  platformFeePercent: number = PLATFORM_FEE_PERCENT,
): GoCardlessPayoutBreakdown {
  const activoraPlatformFee = roundMoney(
    (customerPayment * platformFeePercent) / 100,
  );
  const gocardlessProcessingFee = estimateGoCardlessFee(customerPayment);
  const providerPayout = roundMoney(
    Math.max(
      0,
      customerPayment - activoraPlatformFee - gocardlessProcessingFee,
    ),
  );

  return {
    customerPayment,
    gocardlessProcessingFee,
    activoraPlatformFee,
    providerPayout,
    platformFeePercent,
  };
}
