/**
 * Club finance data access.
 *
 * Production: empty metrics and no seeded transactions (real Stripe/booking data only).
 * Development: demo dataset from mock-data.ts for local UI preview.
 */

import { isDevelopmentEnvironment } from "@/lib/admin-users/production-gates";
import type {
  AccountingIntegration,
  FailedPayment,
  FinanceOverviewMetrics,
  FinancePayout,
  FinanceRefund,
  FinanceReport,
  FinanceTransaction,
  MonthlyInvoice,
  MonthlyRevenuePoint,
  PayoutSummary,
} from "./types";
import * as demo from "./mock-data";

const useDemoFinanceData = isDevelopmentEnvironment();

export const EMPTY_FINANCE_OVERVIEW: FinanceOverviewMetrics = {
  totalRevenue: 0,
  netRevenue: 0,
  platformFees: 0,
  stripeFees: 0,
  pendingPayouts: 0,
  failedPayments: 0,
  refunds: 0,
  averageBookingValue: 0,
  revenueThisMonth: 0,
  revenueLast30Days: 0,
};

export const EMPTY_PAYOUT_SUMMARY: PayoutSummary = {
  availableBalance: 0,
  pendingBalance: 0,
  lastPayoutDate: null,
  lastPayoutAmount: null,
  nextEstimatedPayoutDate: null,
};

export const ROLLING_TWELVE_MONTH_REVENUE = useDemoFinanceData
  ? demo.ROLLING_TWELVE_MONTH_REVENUE
  : 0;

export const MONTHLY_REVENUE_HISTORY: MonthlyRevenuePoint[] = useDemoFinanceData
  ? demo.MONTHLY_REVENUE_HISTORY
  : [];

export const MONTHLY_INVOICES: MonthlyInvoice[] = useDemoFinanceData
  ? demo.MONTHLY_INVOICES
  : [];

export const FINANCE_OVERVIEW: FinanceOverviewMetrics = useDemoFinanceData
  ? demo.FINANCE_OVERVIEW
  : EMPTY_FINANCE_OVERVIEW;

export const FINANCE_TRANSACTIONS: FinanceTransaction[] = useDemoFinanceData
  ? demo.FINANCE_TRANSACTIONS
  : [];

export const PAYOUT_SUMMARY: PayoutSummary = useDemoFinanceData
  ? demo.PAYOUT_SUMMARY
  : EMPTY_PAYOUT_SUMMARY;

export const FINANCE_PAYOUTS: FinancePayout[] = useDemoFinanceData
  ? demo.FINANCE_PAYOUTS
  : [];

export const FAILED_PAYMENTS: FailedPayment[] = useDemoFinanceData
  ? demo.FAILED_PAYMENTS
  : [];

export const FINANCE_REFUNDS: FinanceRefund[] = useDemoFinanceData
  ? demo.FINANCE_REFUNDS
  : [];

export const FINANCE_REPORTS: FinanceReport[] = useDemoFinanceData
  ? demo.FINANCE_REPORTS
  : demo.FINANCE_REPORTS.map((report) => ({
      ...report,
      lastGenerated: null,
    }));

export const ACCOUNTING_INTEGRATIONS: readonly AccountingIntegration[] =
  demo.ACCOUNTING_INTEGRATIONS;

export const BOOKKEEPING_SYNC_ITEMS = demo.BOOKKEEPING_SYNC_ITEMS;

export function getFinanceFilterOptions(): {
  activities: string[];
  venues: string[];
} {
  const activities = [
    ...new Set(FINANCE_TRANSACTIONS.map((transaction) => transaction.activityName)),
  ].sort();
  const venues = [
    ...new Set(FINANCE_TRANSACTIONS.map((transaction) => transaction.venue)),
  ].sort();
  return { activities, venues };
}

export function isDemoFinanceDataEnabled(): boolean {
  return useDemoFinanceData;
}
