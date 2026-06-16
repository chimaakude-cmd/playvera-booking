import { estimateStripeFee, PLATFORM_FEE_PERCENT } from "@/lib/payments";
import type {
  FranchiseePayoutSchedule,
  FranchisorFeeSettings,
  PaymentBreakdown,
  PayoutFrequency,
} from "./types";

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Calculate franchisor fee for a single customer payment.
 *
 * - percentage: percentageFee% of customerPayment
 * - fixed_monthly: not deducted per transaction (returns 0 for preview)
 * - percentage_plus_fixed: percentageFee% + fixedFee per transaction
 * - higher_of_percentage_or_minimum: max(percentageFee%, minimumFee)
 */
export function calculateFranchisorFee(
  customerPayment: number,
  settings: FranchisorFeeSettings,
): number {
  if (customerPayment <= 0) {
    return 0;
  }

  const percentageAmount = roundMoney(
    (customerPayment * settings.percentageFee) / 100,
  );

  switch (settings.feeType) {
    case "percentage":
      return percentageAmount;
    case "fixed_monthly":
      return 0;
    case "percentage_plus_fixed":
      return roundMoney(percentageAmount + settings.fixedFee);
    case "higher_of_percentage_or_minimum":
      return roundMoney(
        Math.max(percentageAmount, settings.minimumFee),
      );
    default:
      return percentageAmount;
  }
}

/**
 * Full payment split: customer payment minus Stripe, Activora 2%, and franchisor fee.
 */
export function calculatePaymentBreakdown(
  customerPayment: number,
  franchisorFeeSettings: FranchisorFeeSettings,
  activeoraFeePercent: number = PLATFORM_FEE_PERCENT,
): PaymentBreakdown {
  const stripeFee = estimateStripeFee(customerPayment);
  const activeoraFee = roundMoney(
    (customerPayment * activeoraFeePercent) / 100,
  );
  const franchisorFee = calculateFranchisorFee(
    customerPayment,
    franchisorFeeSettings,
  );
  const franchiseePayout = roundMoney(
    Math.max(0, customerPayment - stripeFee - activeoraFee - franchisorFee),
  );

  return {
    customerPayment,
    stripeFee,
    activeoraFee,
    franchisorFee,
    franchiseePayout,
  };
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getNextMonthlyDate(from: Date, day: number): Date {
  const clampedDay = Math.min(Math.max(day, 1), 28);
  const candidate = new Date(from);
  candidate.setDate(clampedDay);
  candidate.setHours(9, 0, 0, 0);

  if (candidate <= from) {
    candidate.setMonth(candidate.getMonth() + 1);
    candidate.setDate(clampedDay);
  }

  return candidate;
}

/**
 * Estimate the next payout date from today based on schedule settings.
 */
export function estimateNextPayoutDate(
  schedule: Pick<
    FranchiseePayoutSchedule,
    "frequency" | "monthlyDay" | "holdPeriodDays"
  >,
  fromDate: Date = new Date(),
): Date {
  const afterHold = addDays(fromDate, schedule.holdPeriodDays);

  switch (schedule.frequency) {
    case "every_3_days":
      return addDays(afterHold, 3);
    case "every_7_days":
      return addDays(afterHold, 7);
    case "monthly":
      return getNextMonthlyDate(afterHold, schedule.monthlyDay);
    case "custom":
      return addDays(afterHold, 14);
    default:
      return addDays(afterHold, 7);
  }
}

export function getPayoutScheduleHelperText(
  frequency: PayoutFrequency,
  monthlyDay: number,
): string {
  switch (frequency) {
    case "every_3_days":
      return "Release franchisee payouts every 3 days after the hold period.";
    case "every_7_days":
      return "Release franchisee payouts every 7 days after the hold period.";
    case "monthly": {
      const suffix =
        monthlyDay === 1
          ? "st"
          : monthlyDay === 2
            ? "nd"
            : monthlyDay === 3
              ? "rd"
              : "th";
      return `Release franchisee payouts on the ${monthlyDay}${suffix} of every month.`;
    }
    case "custom":
      return "Custom payout windows — configure per franchisee when overrides are enabled.";
    default:
      return "";
  }
}
