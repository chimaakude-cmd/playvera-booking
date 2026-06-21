"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  getFailedPayments,
  getFinanceFilterOptions,
  getFinanceOverview,
  getFinancePayouts,
  getFinanceRefunds,
  getFinanceReports,
  getFinanceTransactions,
  getMonthlyInvoices,
  getMonthlyRevenueHistory,
  getPayoutSummary,
  getRollingTwelveMonthRevenue,
  isDemoFinanceDataEnabled,
} from "./data";

export function useClubFinanceData() {
  const pathname = usePathname();

  return useMemo(
    () => ({
      isDemo: isDemoFinanceDataEnabled(pathname),
      overview: getFinanceOverview(pathname),
      transactions: getFinanceTransactions(pathname),
      payoutSummary: getPayoutSummary(pathname),
      payouts: getFinancePayouts(pathname),
      failedPayments: getFailedPayments(pathname),
      refunds: getFinanceRefunds(pathname),
      reports: getFinanceReports(pathname),
      monthlyInvoices: getMonthlyInvoices(pathname),
      monthlyRevenueHistory: getMonthlyRevenueHistory(pathname),
      rollingTwelveMonthRevenue: getRollingTwelveMonthRevenue(pathname),
      filterOptions: getFinanceFilterOptions(pathname),
    }),
    [pathname],
  );
}
