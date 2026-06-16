"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  FINANCE_TRANSACTIONS,
  getFinanceFilterOptions,
} from "@/lib/club-finance/mock-data";
import type { PaymentStatus, PayoutStatus } from "@/lib/club-finance/types";
import { formatFinanceDate } from "@/lib/club-finance";
import { formatMoney } from "@/lib/payments";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { paginateItems } from "@/lib/pagination";
import {
  FinanceButton,
  FinanceEmptyState,
  FinanceSection,
  FinanceTableWrap,
  PaymentStatusBadge,
  PayoutStatusBadge,
  stubAction,
  stubExportCsv,
} from "./shared";

const PAYMENT_STATUSES: Array<PaymentStatus | "all"> = [
  "all",
  "paid",
  "pending",
  "failed",
  "refunded",
  "partially_refunded",
];

const PAYOUT_STATUSES: Array<PayoutStatus | "all"> = [
  "all",
  "paid_out",
  "pending",
  "in_transit",
  "held",
];

export function FinanceTransactionsSection() {
  const { activities, venues } = getFinanceFilterOptions();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activity, setActivity] = useState("all");
  const [venue, setVenue] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | "all">(
    "all",
  );
  const [payoutStatus, setPayoutStatus] = useState<PayoutStatus | "all">("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return FINANCE_TRANSACTIONS.filter((txn) => {
      if (activity !== "all" && txn.activityName !== activity) return false;
      if (venue !== "all" && txn.venue !== venue) return false;
      if (paymentStatus !== "all" && txn.paymentStatus !== paymentStatus) {
        return false;
      }
      if (payoutStatus !== "all" && txn.payoutStatus !== payoutStatus) {
        return false;
      }
      if (dateFrom && new Date(txn.date) < new Date(dateFrom)) return false;
      if (dateTo && new Date(txn.date) > new Date(`${dateTo}T23:59:59`)) {
        return false;
      }
      return true;
    });
  }, [activity, venue, paymentStatus, payoutStatus, dateFrom, dateTo]);

  const pagination = useMemo(
    () => paginateItems(filtered, page, 10),
    [filtered, page],
  );

  return (
    <FinanceSection
      title="Transactions"
      description="Every booking payment with fee breakdown and payout status."
      action={
        <FinanceButton
          variant="secondary"
          onClick={stubExportCsv("activora-transactions.csv")}
        >
          Export CSV
        </FinanceButton>
      }
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <FilterField label="From">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </FilterField>
        <FilterField label="To">
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </FilterField>
        <FilterField label="Activity">
          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            <option value="all">All activities</option>
            {activities.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Venue">
          <select
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            <option value="all">All venues</option>
            {venues.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Payment status">
          <select
            value={paymentStatus}
            onChange={(e) =>
              setPaymentStatus(e.target.value as PaymentStatus | "all")
            }
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All statuses" : s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Payout status">
          <select
            value={payoutStatus}
            onChange={(e) =>
              setPayoutStatus(e.target.value as PayoutStatus | "all")
            }
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            {PAYOUT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All statuses" : s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </FilterField>
      </div>

      {pagination.totalItems === 0 ? (
        <FinanceEmptyState
          title="No transactions match"
          description="Try adjusting your filters or date range."
        />
      ) : (
        <FinanceTableWrap>
          <thead>
            <tr className="border-b border-zinc-100 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              <th className="pb-3 pr-4">Date</th>
              <th className="pb-3 pr-4">Parent</th>
              <th className="pb-3 pr-4">Child</th>
              <th className="pb-3 pr-4">Activity</th>
              <th className="pb-3 pr-4 text-right">Gross booking</th>
              <th className="pb-3 pr-4 text-right">Stripe fee</th>
              <th className="pb-3 pr-4 text-right">Activora fee</th>
              <th className="pb-3 pr-4 text-right">Net provider</th>
              <th className="pb-3 pr-4">Payment</th>
              <th className="pb-3 pr-4">Payout</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {pagination.items.map((txn) => (
              <tr key={txn.id} className="text-zinc-700">
                <td className="py-3.5 pr-4 whitespace-nowrap text-zinc-500">
                  {formatFinanceDate(txn.date)}
                </td>
                <td className="py-3.5 pr-4">
                  <p className="font-medium text-zinc-900">{txn.parentName}</p>
                  <p className="text-xs text-zinc-400">{txn.parentEmail}</p>
                </td>
                <td className="py-3.5 pr-4">{txn.childName}</td>
                <td className="py-3.5 pr-4">
                  <p>{txn.activityName}</p>
                  <p className="text-xs text-zinc-400">{txn.venue}</p>
                </td>
                <td className="py-3.5 pr-4 text-right font-medium">
                  {formatMoney(txn.grossAmount)}
                </td>
                <td className="py-3.5 pr-4 text-right text-zinc-500">
                  {formatMoney(txn.stripeFee)}
                </td>
                <td className="py-3.5 pr-4 text-right text-zinc-500">
                  {formatMoney(txn.platformFee)}
                </td>
                <td className="py-3.5 pr-4 text-right font-semibold text-zinc-900">
                  {formatMoney(txn.netAmount)}
                </td>
                <td className="py-3.5 pr-4">
                  <PaymentStatusBadge status={txn.paymentStatus} />
                </td>
                <td className="py-3.5 pr-4">
                  <PayoutStatusBadge status={txn.payoutStatus} />
                </td>
                <td className="py-3.5">
                  <div className="flex flex-wrap gap-1">
                    <FinanceButton
                      size="sm"
                      variant="ghost"
                      onClick={stubAction("Download receipt")}
                    >
                      Receipt
                    </FinanceButton>
                    <Link
                      href={`/club/bookings`}
                      className="inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-50"
                    >
                      Booking
                    </Link>
                    {txn.paymentStatus === "paid" ? (
                      <FinanceButton
                        size="sm"
                        variant="ghost"
                        onClick={stubAction("Issue refund")}
                      >
                        Refund
                      </FinanceButton>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </FinanceTableWrap>
      )}
      {pagination.totalItems > 0 ? (
        <PaginationControls
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          onPageChange={setPage}
        />
      ) : null}
    </FinanceSection>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}
