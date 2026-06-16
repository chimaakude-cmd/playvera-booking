/**
 * Franchisor / franchisee finance and payout types.
 *
 * Storage (today): localStorage keys in storage.ts
 * Database: future migration 00023_finance_payouts.sql
 */

export type PayoutFrequency =
  | "every_3_days"
  | "every_7_days"
  | "monthly"
  | "custom";

export type FranchisorFeeType =
  | "percentage"
  | "fixed_monthly"
  | "percentage_plus_fixed"
  | "higher_of_percentage_or_minimum";

export type BillingPeriod = "weekly" | "monthly";

export type FinancePayoutStatus =
  | "scheduled"
  | "processing"
  | "paid"
  | "held"
  | "failed";

export type FranchiseePayoutSchedule = {
  organisationId: string;
  frequency: PayoutFrequency;
  monthlyDay: number;
  holdPeriodDays: number;
  nextScheduledPayout: string | null;
  appliesToAll: boolean;
  allowPerFranchiseeOverride: boolean;
  updatedAt: string;
};

export type FranchisorFeeSettings = {
  organisationId: string;
  feeType: FranchisorFeeType;
  percentageFee: number;
  minimumFee: number;
  fixedFee: number;
  billingPeriod: BillingPeriod;
  appliesToAll: boolean;
  allowPerFranchiseeOverride: boolean;
  updatedAt: string;
};

export type ClubPayoutPreferences = {
  clubId: string;
  frequency: PayoutFrequency;
  monthlyDay: number;
  nextEstimatedPayout: string | null;
  availableBalance: number;
  pendingBalance: number;
  updatedAt: string;
};

export type PerFranchiseePayoutOverride = {
  clubId: string;
  clubName: string;
  frequency?: PayoutFrequency;
  monthlyDay?: number;
  holdPeriodDays?: number;
};

export type PerFranchiseeFeeOverride = {
  clubId: string;
  clubName: string;
  feeType?: FranchisorFeeType;
  percentageFee?: number;
  minimumFee?: number;
  fixedFee?: number;
};

export type PaymentBreakdown = {
  customerPayment: number;
  stripeFee: number;
  activeoraFee: number;
  franchisorFee: number;
  franchiseePayout: number;
};

export type FinanceReportRow = {
  id: string;
  clubId: string;
  clubName: string;
  grossSales: number;
  stripeFees: number;
  activeoraFees: number;
  franchisorFees: number;
  netPayout: number;
  payoutDate: string;
  payoutStatus: FinancePayoutStatus;
};

export const PAYOUT_FREQUENCY_LABELS: Record<PayoutFrequency, string> = {
  every_3_days: "Every 3 days",
  every_7_days: "Every 7 days",
  monthly: "Monthly on selected day",
  custom: "Custom date range",
};

export const FRANCHISOR_FEE_TYPE_LABELS: Record<FranchisorFeeType, string> = {
  percentage: "Percentage of gross sales",
  fixed_monthly: "Fixed monthly fee",
  percentage_plus_fixed: "Percentage plus fixed fee",
  higher_of_percentage_or_minimum:
    "Higher of percentage or minimum fee",
};

export const BILLING_PERIOD_LABELS: Record<BillingPeriod, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
};

export const FINANCE_PAYOUT_STATUS_LABELS: Record<FinancePayoutStatus, string> =
  {
    scheduled: "Scheduled",
    processing: "Processing",
    paid: "Paid",
    held: "Held",
    failed: "Failed",
  };
