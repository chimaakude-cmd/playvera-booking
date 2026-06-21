"use client";

import { formatFinanceDate } from "@/lib/club-finance";
import { useClubFinanceData } from "@/lib/club-finance/use-club-finance-data";
import { formatMoney } from "@/lib/payments";
import {
  FinanceButton,
  FinanceEmptyState,
  FinanceSection,
  FinanceTableWrap,
  RetryStatusBadge,
  stubAction,
} from "./shared";

export function FinanceFailedPaymentsSection() {
  const { failedPayments } = useClubFinanceData();

  return (
    <FinanceSection
      title="Failed payments"
      description="Payments that did not complete. Retry, message the parent, or cancel the booking."
    >
      {failedPayments.length === 0 ? (
        <FinanceEmptyState
          title="No failed payments"
          description="All recent booking payments completed successfully."
        />
      ) : (
        <FinanceTableWrap>
          <thead>
            <tr className="border-b border-zinc-100 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              <th className="pb-3 pr-4">Parent</th>
              <th className="pb-3 pr-4">Activity</th>
              <th className="pb-3 pr-4 text-right">Amount</th>
              <th className="pb-3 pr-4">Reason</th>
              <th className="pb-3 pr-4">Last attempted</th>
              <th className="pb-3 pr-4">Retry status</th>
              <th className="pb-3 pr-4">Action needed</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {failedPayments.map((fp) => (
              <tr key={fp.id} className="text-zinc-700">
                <td className="py-3.5 pr-4">
                  <p className="font-medium text-zinc-900">{fp.parentName}</p>
                  <p className="text-xs text-zinc-400">{fp.parentEmail}</p>
                </td>
                <td className="py-3.5 pr-4">{fp.activityName}</td>
                <td className="py-3.5 pr-4 text-right font-medium">
                  {formatMoney(fp.amount)}
                </td>
                <td className="py-3.5 pr-4 max-w-xs text-sm text-zinc-600">
                  {fp.reason}
                </td>
                <td className="py-3.5 pr-4 whitespace-nowrap text-zinc-500">
                  {formatFinanceDate(fp.lastAttempted)}
                </td>
                <td className="py-3.5 pr-4">
                  <RetryStatusBadge status={fp.retryStatus} />
                </td>
                <td className="py-3.5 pr-4 text-sm text-zinc-600">
                  {fp.actionNeeded}
                </td>
                <td className="py-3.5">
                  <div className="flex flex-wrap gap-1">
                    <FinanceButton
                      size="sm"
                      variant="secondary"
                      onClick={stubAction("Retry payment")}
                    >
                      Retry
                    </FinanceButton>
                    <FinanceButton
                      size="sm"
                      variant="ghost"
                      onClick={stubAction("Message parent")}
                    >
                      Message
                    </FinanceButton>
                    <FinanceButton
                      size="sm"
                      variant="danger"
                      onClick={stubAction("Cancel booking")}
                    >
                      Cancel
                    </FinanceButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </FinanceTableWrap>
      )}
    </FinanceSection>
  );
}
