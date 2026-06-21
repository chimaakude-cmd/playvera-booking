"use client";

import { useEffect, useMemo, useState } from "react";
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

type VatThresholdPayload = {
  rollingTwelveMonthRevenue?: number;
};

export function useClubFinanceData() {
  const pathname = usePathname();
  const isDemo = isDemoFinanceDataEnabled(pathname);
  const [rollingTwelveMonthRevenue, setRollingTwelveMonthRevenue] = useState(
    () => getRollingTwelveMonthRevenue(pathname),
  );

  useEffect(() => {
    if (isDemo) {
      setRollingTwelveMonthRevenue(getRollingTwelveMonthRevenue(pathname));
      return;
    }

    let cancelled = false;

    void fetch("/api/club/vat-threshold", { cache: "no-store" })
      .then(async (response) =>
        response.ok ? ((await response.json()) as VatThresholdPayload) : null,
      )
      .then((payload) => {
        if (!cancelled && payload?.rollingTwelveMonthRevenue != null) {
          setRollingTwelveMonthRevenue(payload.rollingTwelveMonthRevenue);
        }
      })
      .catch(() => {
        // Keep zero fallback when the API is unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, [isDemo, pathname]);

  return useMemo(
    () => ({
      isDemo,
      overview: getFinanceOverview(pathname),
      transactions: getFinanceTransactions(pathname),
      payoutSummary: getPayoutSummary(pathname),
      payouts: getFinancePayouts(pathname),
      failedPayments: getFailedPayments(pathname),
      refunds: getFinanceRefunds(pathname),
      reports: getFinanceReports(pathname),
      monthlyInvoices: getMonthlyInvoices(pathname),
      monthlyRevenueHistory: getMonthlyRevenueHistory(pathname),
      rollingTwelveMonthRevenue,
      filterOptions: getFinanceFilterOptions(pathname),
    }),
    [isDemo, pathname, rollingTwelveMonthRevenue],
  );
}
