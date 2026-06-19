import {
  FINANCE_OVERVIEW,
  FINANCE_REFUNDS,
  FINANCE_TRANSACTIONS,
  FAILED_PAYMENTS,
  formatFinanceShortDate,
} from "@/lib/club-finance";
import { formatMoney } from "@/lib/payments";
import { FinanceSection, FinanceStatCard } from "./shared";

export function FinanceOverviewSection() {
  const metrics = FINANCE_OVERVIEW;
  const recentPaid = FINANCE_TRANSACTIONS.filter(
    (transaction) => transaction.paymentStatus === "paid",
  ).slice(0, 4);
  const pendingRefunds = FINANCE_REFUNDS.filter(
    (refund) => refund.status === "pending",
  );
  const needsAttention =
    FAILED_PAYMENTS.length > 0 || pendingRefunds.length > 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <FinanceStatCard
          label="Total revenue"
          value={metrics.totalRevenue}
          hint="All-time gross booking revenue"
          accent="teal"
        />
        <FinanceStatCard
          label="Net revenue"
          value={metrics.netRevenue}
          hint="After platform and Stripe fees"
          accent="emerald"
        />
        <FinanceStatCard
          label="Platform fees"
          value={metrics.platformFees}
          hint="Activora platform fee collected"
          accent="violet"
        />
        <FinanceStatCard
          label="Stripe fees"
          value={metrics.stripeFees}
          hint="Payment processing fees"
          accent="slate"
        />
        <FinanceStatCard
          label="Pending payouts"
          value={metrics.pendingPayouts}
          hint="Awaiting next payout cycle"
          accent="amber"
        />
        <FinanceStatCard
          label="Failed payments"
          value={metrics.failedPayments}
          hint="Require follow-up"
          accent="rose"
          isCurrency={false}
        />
        <FinanceStatCard
          label="Refunds"
          value={metrics.refunds}
          hint="Issued this month"
          accent="rose"
        />
        <FinanceStatCard
          label="Avg booking value"
          value={metrics.averageBookingValue}
          hint="Mean gross per booking"
          accent="slate"
        />
        <FinanceStatCard
          label="Revenue this month"
          value={metrics.revenueThisMonth}
          hint="Current calendar month to date"
          accent="teal"
        />
        <FinanceStatCard
          label="Last 30 days"
          value={metrics.revenueLast30Days}
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
              {recentPaid.map((transaction) => (
                <li
                  key={transaction.id}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-900">
                      {transaction.parentName}
                    </p>
                    <p className="truncate text-sm text-zinc-500">
                      {transaction.activityName}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold text-zinc-900">
                      {formatMoney(transaction.grossAmount)}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {formatFinanceShortDate(transaction.date)}
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
          {!needsAttention ? (
            <p className="text-sm text-zinc-500">No payment actions needed</p>
          ) : (
            <div className="space-y-4">
              {FAILED_PAYMENTS.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Failed payments
                  </p>
                  <ul className="mt-2 space-y-2">
                    {FAILED_PAYMENTS.slice(0, 2).map((failedPayment) => (
                      <li
                        key={failedPayment.id}
                        className="rounded-xl border border-rose-100 bg-rose-50/50 px-4 py-3"
                      >
                        <p className="text-sm font-medium text-zinc-900">
                          {failedPayment.parentName} —{" "}
                          {formatMoney(failedPayment.amount)}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {failedPayment.reason}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {pendingRefunds.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Pending refunds
                  </p>
                  <ul className="mt-2 space-y-2">
                    {pendingRefunds.map((refund) => (
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
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </FinanceSection>
      </div>
    </div>
  );
}
