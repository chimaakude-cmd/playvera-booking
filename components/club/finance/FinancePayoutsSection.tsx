"use client";

import { canWithdrawPayouts, getPayoutBlockMessage } from "@/lib/club-setup";
import { formatFinanceShortDate } from "@/lib/club-finance";
import { useClubFinanceData } from "@/lib/club-finance/use-club-finance-data";
import { formatMoney } from "@/lib/payments";
import { useStripeConnectBalances } from "@/lib/stripe-connect/use-stripe-connect-balances";
import { ClubPayoutPreferences } from "./ClubPayoutPreferences";
import {
  FinanceEmptyState,
  FinanceSection,
  FinanceStatCard,
  FinanceTableWrap,
  PayoutStatusBadge,
} from "./shared";

export function FinancePayoutsSection() {
  const { payoutSummary, payouts, transactions, isDemo } = useClubFinanceData();
  const balances = useStripeConnectBalances();
  const payoutsReady = canWithdrawPayouts();

  const stripeConnected = balances.stripeConnected;
  const useLiveBalances = stripeConnected && !isDemo;
  const availableBalance = useLiveBalances
    ? balances.availableBalance
    : isDemo
      ? payoutSummary.availableBalance
      : 0;
  const pendingBalance = useLiveBalances
    ? balances.pendingBalance
    : isDemo
      ? payoutSummary.pendingBalance
      : 0;
  const lastPayoutAmount = useLiveBalances
    ? balances.lastPayoutAmount
    : payoutSummary.lastPayoutAmount;
  const lastPayoutDate = useLiveBalances
    ? balances.lastPayoutDate
    : payoutSummary.lastPayoutDate;

  return (
    <div className="space-y-6">
      {!stripeConnected ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Connect Stripe to receive payouts
        </div>
      ) : balances.balanceUnavailable ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Balance unavailable. Please reconnect Stripe or contact support.
        </div>
      ) : !payoutsReady ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {getPayoutBlockMessage()}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <FinanceStatCard
          label="Available balance"
          value={availableBalance}
          hint="Ready for next payout"
          accent="emerald"
        />
        <FinanceStatCard
          label="Pending balance"
          value={pendingBalance}
          hint="Clearing period"
          accent="amber"
        />
      </div>

      <ClubPayoutPreferences />

      <div className="grid gap-4 sm:grid-cols-2">
        <FinanceStatCard
          label="Last payout"
          value={
            lastPayoutAmount ? formatMoney(lastPayoutAmount) : "—"
          }
          hint={
            lastPayoutDate
              ? formatFinanceShortDate(lastPayoutDate)
              : "No payouts yet"
          }
          accent="teal"
          isCurrency={false}
        />
        <FinanceStatCard
          label="Next payout"
          value={
            payoutSummary.nextEstimatedPayoutDate
              ? formatFinanceShortDate(payoutSummary.nextEstimatedPayoutDate)
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
        {payouts.length === 0 ? (
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
              {payouts.map((payout) => {
                const linked = payout.linkedTransactionIds
                  .map((id) =>
                    transactions.find((transaction) => transaction.id === id),
                  )
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
                                {transaction.parentName} — {transaction.activityName}{" "}
                                ({formatMoney(transaction.netAmount)})
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
