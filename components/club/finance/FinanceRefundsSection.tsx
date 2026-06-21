"use client";

import { formatFinanceDate } from "@/lib/club-finance";
import { useClubFinanceData } from "@/lib/club-finance/use-club-finance-data";
import { formatMoney } from "@/lib/payments";
import {
  FinanceEmptyState,
  FinanceSection,
  FinanceTableWrap,
  RefundStatusBadge,
} from "./shared";

export function FinanceRefundsSection() {
  const { refunds } = useClubFinanceData();

  return (
    <FinanceSection
      title="Refunds"
      description="All refunds issued with reason and processing status."
    >
      {refunds.length === 0 ? (
        <FinanceEmptyState
          title="No refunds"
          description="Refunds will appear here when issued from transactions or bookings."
        />
      ) : (
        <FinanceTableWrap>
          <thead>
            <tr className="border-b border-zinc-100 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              <th className="pb-3 pr-4">Date</th>
              <th className="pb-3 pr-4">Customer</th>
              <th className="pb-3 pr-4">Booking</th>
              <th className="pb-3 pr-4 text-right">Amount</th>
              <th className="pb-3 pr-4">Reason</th>
              <th className="pb-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {refunds.map((refund) => (
              <tr key={refund.id} className="text-zinc-700">
                <td className="py-3.5 pr-4 whitespace-nowrap text-zinc-500">
                  {formatFinanceDate(refund.date)}
                </td>
                <td className="py-3.5 pr-4">
                  <p className="font-medium text-zinc-900">
                    {refund.customerName}
                  </p>
                  <p className="text-xs text-zinc-400">{refund.customerEmail}</p>
                </td>
                <td className="py-3.5 pr-4">
                  <p>{refund.bookingReference}</p>
                  <p className="text-xs text-zinc-400">{refund.activityName}</p>
                </td>
                <td className="py-3.5 pr-4 text-right font-semibold text-zinc-900">
                  {formatMoney(refund.refundAmount)}
                </td>
                <td className="py-3.5 pr-4 text-sm text-zinc-600">
                  {refund.reason}
                </td>
                <td className="py-3.5">
                  <RefundStatusBadge status={refund.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </FinanceTableWrap>
      )}
    </FinanceSection>
  );
}
