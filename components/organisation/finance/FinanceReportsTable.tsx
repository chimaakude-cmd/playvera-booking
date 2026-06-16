"use client";

import { useEffect, useState } from "react";
import { formatFinanceShortDate } from "@/lib/club-finance";
import {
  FINANCE_PAYOUT_STATUS_LABELS,
  type FinancePayoutStatus,
  type FinanceReportRow,
} from "@/lib/finance-payouts";
import { getFinanceReports } from "@/lib/finance-payouts/storage";
import { formatMoney } from "@/lib/payments";

const statusStyles: Record<FinancePayoutStatus, string> = {
  scheduled: "bg-sky-50 text-sky-700 ring-sky-200",
  processing: "bg-amber-50 text-amber-700 ring-amber-200",
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  held: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  failed: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function FinanceReportsTable() {
  const [rows, setRows] = useState<FinanceReportRow[]>([]);

  useEffect(() => {
    setRows(getFinanceReports());
  }, []);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No finance reports yet. Payout reports will appear here after the first
        payout cycle.
      </p>
    );
  }

  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-100 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            <th className="pb-3 pr-4">Club</th>
            <th className="pb-3 pr-4 text-right">Gross sales</th>
            <th className="pb-3 pr-4 text-right">Stripe fees</th>
            <th className="pb-3 pr-4 text-right">Activora fees</th>
            <th className="pb-3 pr-4 text-right">Franchisor fees</th>
            <th className="pb-3 pr-4 text-right">Net payout</th>
            <th className="pb-3 pr-4">Payout date</th>
            <th className="pb-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50">
          {rows.map((row) => (
            <tr key={row.id} className="text-zinc-700">
              <td className="py-3.5 pr-4 font-medium text-zinc-900">
                {row.clubName}
              </td>
              <td className="py-3.5 pr-4 text-right">
                {formatMoney(row.grossSales)}
              </td>
              <td className="py-3.5 pr-4 text-right text-rose-600">
                −{formatMoney(row.stripeFees)}
              </td>
              <td className="py-3.5 pr-4 text-right text-rose-600">
                −{formatMoney(row.activeoraFees)}
              </td>
              <td className="py-3.5 pr-4 text-right text-rose-600">
                −{formatMoney(row.franchisorFees)}
              </td>
              <td className="py-3.5 pr-4 text-right font-semibold text-emerald-700">
                {formatMoney(row.netPayout)}
              </td>
              <td className="py-3.5 pr-4 whitespace-nowrap">
                {formatFinanceShortDate(row.payoutDate)}
              </td>
              <td className="py-3.5">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusStyles[row.payoutStatus]}`}
                >
                  {FINANCE_PAYOUT_STATUS_LABELS[row.payoutStatus]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
