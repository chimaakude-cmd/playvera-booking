import {
  FINANCE_OVERVIEW,
  FINANCE_PAYOUTS,
  FINANCE_REFUNDS,
  FINANCE_TRANSACTIONS,
  FAILED_PAYMENTS,
} from "@/lib/club-finance";
import { formatFinanceShortDate } from "@/lib/club-finance";
import { formatMoney } from "@/lib/payments";
import { FinanceSection, FinanceStatCard } from "./shared";

export function FinanceOverviewSection() {
  const m = FINANCE_OVERVIEW;
  const recentPaid = FINANCE_TRANSACTIONS.filter((t) => t.paymentStatus === "paid")
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <FinanceStatCard
          label="Total revenue"
          value={m.totalRevenue}
          hint="All-time gross booking revenue"
          accent="teal"
        />
        <FinanceStatCard
          label="Net revenue"
          value={m.netRevenue}
          hint="After platform and Stripe fees"
          accent="emerald"
        />
        <FinanceStatCard
          label="Platform fees"
          value={m.platformFees}
          hint="Activora platform fee collected"
          accent="violet"
        />
        <FinanceStatCard
          label="Stripe fees"
          value={m.stripeFees}
          hint="Payment processing fees"
          accent="slate"
        />
        <FinanceStatCard
          label="Pending payouts"
          value={m.pendingPayouts}
          hint="Awaiting next payout cycle"
          accent="amber"
        />
        <FinanceStatCard
          label="Failed payments"
          value={m.failedPayments}
          hint="Require follow-up"
          accent="rose"
          isCurrency={false}
        />
        <FinanceStatCard
          label="Refunds"
          value={m.refunds}
          hint="Issued this month"
          accent="rose"
        />
        <FinanceStatCard
          label="Avg booking value"
          value={m.averageBookingValue}
          hint="Mean gross per booking"
          accent="slate"
        />
        <FinanceStatCard
          label="Revenue this month"
          value={m.revenueThisMonth}
          hint="June 2026 to date"
          accent="teal"
        />
        <FinanceStatCard
          label="Last 30 days"
          value={m.revenueLast30Days}
          hint="Rolling gross revenue"
          accent="violet"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FinanceSection
          title="Recent transactions"
          description="Latest successful and pending payments."
        >
          {recentPaid.length === 0 ? (
            <p className="text-sm text-zinc-500">No transactions yet.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {recentPaid.map((txn) => (
                <li
                  key={txn.id}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-900">
                      {txn.parentName}
                    </p>
                    <p className="truncate text-sm text-zinc-500">
                      {txn.activityName}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold text-zinc-900">
                      {formatMoney(txn.grossAmount)}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {formatFinanceShortDate(txn.date)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </FinanceSection>

        <FinanceSection
          title="Attention needed"
          description="Failed payments and pending refunds."
        >
          <div className="space-y-4">
            {FAILED_PAYMENTS.length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Failed payments
                </p>
                <ul className="mt-2 space-y-2">
                  {FAILED_PAYMENTS.slice(0, 2).map((fp) => (
                    <li
                      key={fp.id}
                      className="rounded-xl border border-rose-100 bg-rose-50/50 px-4 py-3"
                    >
                      <p className="text-sm font-medium text-zinc-900">
                        {fp.parentName} — {formatMoney(fp.amount)}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">{fp.reason}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {FINANCE_REFUNDS.filter((r) => r.status === "pending").length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Pending refunds
                </p>
                <ul className="mt-2 space-y-2">
                  {FINANCE_REFUNDS.filter((r) => r.status === "pending").map(
                    (refund) => (
                      <li
                        key={refund.id}
                        className="rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3"
                      >
                        <p className="text-sm font-medium text-zinc-900">
                          {refund.customerName} —{" "}
                          {formatMoney(refund.refundAmount)}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {refund.reason}
                        </p>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            ) : null}
            {FINANCE_PAYOUTS[0] ? (
              <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Last payout
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-900">
                  {formatMoney(FINANCE_PAYOUTS[0].amount)} on{" "}
                  {formatFinanceShortDate(FINANCE_PAYOUTS[0].date)}
                </p>
              </div>
            ) : null}
          </div>
        </FinanceSection>
      </div>
    </div>
  );
}
