"use client";

import {
  canWithdrawPayouts,
  getPayoutBlockMessage,
} from "@/lib/club-setup";
import {
  FINANCE_PAYOUTS,
  FINANCE_TRANSACTIONS,
  PAYOUT_SUMMARY,
  formatFinanceShortDate,
} from "@/lib/club-finance";
import { formatMoney } from "@/lib/payments";
import {
  getStripeConnectState,
  isStripeConnected,
} from "@/lib/stripe-connect";
import { ClubPayoutPreferences } from "./ClubPayoutPreferences";
import {
  FinanceEmptyState,
  FinanceSection,
  FinanceStatCard,
  FinanceTableWrap,
  PayoutStatusBadge,
} from "./shared";

export function FinancePayoutsSection() {
  const summary = PAYOUT_SUMMARY;
  const payoutsReady = canWithdrawPayouts();
  const stripeConnected = isStripeConnected(getStripeConnectState().status);

  return (
    <div className="space-y-6">
      {!stripeConnected ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Connect Stripe to receive payouts
        </div>
      ) : !payoutsReady ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {getPayoutBlockMessage()}
        </div>
      ) : null}

      <ClubPayoutPreferences />

      <div className="grid gap-4 sm:grid-cols-2">
        <FinanceStatCard
          label="Last payout"
          value={
            summary.lastPayoutAmount
              ? formatMoney(summary.lastPayoutAmount)
              : "—"
          }
          hint={
            summary.lastPayoutDate
              ? formatFinanceShortDate(summary.lastPayoutDate)
              : "No payouts yet"
          }
          accent="teal"
          isCurrency={false}
        />
        <FinanceStatCard
          label="Next payout"
          value={
            summary.nextEstimatedPayoutDate
              ? formatFinanceShortDate(summary.nextEstimatedPayoutDate)
              : "—"
          }
          hint="Estimated arrival date"
          accent="violet"
          isCurrency={false}
        />
      </div>

      <FinanceSection
        title="Payout history"
        description="Stripe Connect payouts with linked transaction references."
      >
        {FINANCE_PAYOUTS.length === 0 ? (
          <FinanceEmptyState
            title="No payouts yet"
            description={
              stripeConnected
                ? "Payouts appear here after completed bookings are paid out through Stripe."
                : "Connect Stripe to receive payouts from completed bookings."
            }
          />
        ) : (
          <FinanceTableWrap>
            <thead>
              <tr className="border-b border-zinc-100 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4 text-right">Amount</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Reference</th>
                <th className="pb-3">Linked transactions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {FINANCE_PAYOUTS.map((payout) => {
                const linked = payout.linkedTransactionIds
                  .map((id) => FINANCE_TRANSACTIONS.find((transaction) => transaction.id === id))
                  .filter(Boolean);

                return (
                  <tr key={payout.id} className="text-zinc-700">
                    <td className="py-3.5 pr-4 whitespace-nowrap">
                      {formatFinanceShortDate(payout.date)}
                    </td>
                    <td className="py-3.5 pr-4 text-right font-semibold text-zinc-900">
                      {formatMoney(payout.amount)}
                    </td>
                    <td className="py-3.5 pr-4">
                      <PayoutStatusBadge status={payout.status} />
                    </td>
                    <td className="py-3.5 pr-4 font-mono text-xs text-zinc-500">
                      {payout.reference}
                    </td>
                    <td className="py-3.5">
                      {linked.length > 0 ? (
                        <ul className="space-y-1 text-xs">
                          {linked.map((transaction) =>
                            transaction ? (
                              <li key={transaction.id} className="text-zinc-600">
                                {transaction.parentName} — {transaction.activityName} (
                                {formatMoney(transaction.netAmount)})
                              </li>
                            ) : null,
                          )}
                        </ul>
                      ) : (
                        <span className="text-xs text-zinc-400">
                          {payout.linkedTransactionIds.length} transactions
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </FinanceTableWrap>
        )}
      </FinanceSection>
    </div>
  );
}
