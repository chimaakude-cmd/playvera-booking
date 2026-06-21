/**
 * Club finance data access.
 *
 * Production / real clubs: empty metrics unless on explicit demo routes.
 * Demo routes (/club/demo*): seeded dataset from mock-data.ts for UI preview.
 */

import { shouldShowClubDemoData } from "@/lib/club-demo-mode";
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

/** Safe module defaults — always empty (use getters or useClubFinanceData in UI). */
export const ROLLING_TWELVE_MONTH_REVENUE = 0;
export const MONTHLY_REVENUE_HISTORY: MonthlyRevenuePoint[] = [];
export const MONTHLY_INVOICES: MonthlyInvoice[] = [];
export const FINANCE_OVERVIEW = EMPTY_FINANCE_OVERVIEW;
export const FINANCE_TRANSACTIONS: FinanceTransaction[] = [];
export const PAYOUT_SUMMARY = EMPTY_PAYOUT_SUMMARY;
export const FINANCE_PAYOUTS: FinancePayout[] = [];
export const FAILED_PAYMENTS: FailedPayment[] = [];
export const FINANCE_REFUNDS: FinanceRefund[] = [];
export const FINANCE_REPORTS: FinanceReport[] = [];

export const ACCOUNTING_INTEGRATIONS: readonly AccountingIntegration[] =
  demo.ACCOUNTING_INTEGRATIONS;

export const BOOKKEEPING_SYNC_ITEMS = demo.BOOKKEEPING_SYNC_ITEMS;

export function isDemoFinanceDataEnabled(pathname?: string): boolean {
  return shouldShowClubDemoData(pathname);
}

export function getRollingTwelveMonthRevenue(pathname?: string): number {
  return isDemoFinanceDataEnabled(pathname)
    ? demo.ROLLING_TWELVE_MONTH_REVENUE
    : 0;
}

export function getMonthlyRevenueHistory(
  pathname?: string,
): MonthlyRevenuePoint[] {
  return isDemoFinanceDataEnabled(pathname)
    ? demo.MONTHLY_REVENUE_HISTORY
    : [];
}

export function getMonthlyInvoices(pathname?: string): MonthlyInvoice[] {
  return isDemoFinanceDataEnabled(pathname) ? demo.MONTHLY_INVOICES : [];
}

export function getFinanceOverview(pathname?: string): FinanceOverviewMetrics {
  return isDemoFinanceDataEnabled(pathname)
    ? demo.FINANCE_OVERVIEW
    : EMPTY_FINANCE_OVERVIEW;
}

export function getFinanceTransactions(pathname?: string): FinanceTransaction[] {
  return isDemoFinanceDataEnabled(pathname) ? demo.FINANCE_TRANSACTIONS : [];
}

export function getPayoutSummary(pathname?: string): PayoutSummary {
  return isDemoFinanceDataEnabled(pathname)
    ? demo.PAYOUT_SUMMARY
    : EMPTY_PAYOUT_SUMMARY;
}

export function getFinancePayouts(pathname?: string): FinancePayout[] {
  return isDemoFinanceDataEnabled(pathname) ? demo.FINANCE_PAYOUTS : [];
}

export function getFailedPayments(pathname?: string): FailedPayment[] {
  return isDemoFinanceDataEnabled(pathname) ? demo.FAILED_PAYMENTS : [];
}

export function getFinanceRefunds(pathname?: string): FinanceRefund[] {
  return isDemoFinanceDataEnabled(pathname) ? demo.FINANCE_REFUNDS : [];
}

export function getFinanceReports(pathname?: string): FinanceReport[] {
  return isDemoFinanceDataEnabled(pathname) ? demo.FINANCE_REPORTS : [];
}

export function getFinanceFilterOptions(pathname?: string): {
  activities: string[];
  venues: string[];
} {
  const transactions = getFinanceTransactions(pathname);
  const activities = [
    ...new Set(transactions.map((transaction) => transaction.activityName)),
  ].sort();
  const venues = [
    ...new Set(transactions.map((transaction) => transaction.venue)),
  ].sort();
  return { activities, venues };
}
