import { COMMISSION_TIERS } from "@/constants/commission-tiers";

type CommissionTierTableProps = {
  caption?: string;
};

export function CommissionTierTable({ caption }: CommissionTierTableProps) {
  return (
    <div className="not-prose overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-700">
      <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-700">
        {caption ? (
          <caption className="sr-only">{caption}</caption>
        ) : (
          <caption className="sr-only">Activora platform commission tiers by plan</caption>
        )}
        <thead className="bg-zinc-50 dark:bg-zinc-900/60">
          <tr>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">
              Plan
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">
              Monthly price
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">
              Platform fee
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
          {COMMISSION_TIERS.map((tier) => (
            <tr key={tier.plan}>
              <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                {tier.plan}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{tier.monthlyPrice}</td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {tier.platformFeePercent}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-zinc-200 px-4 py-3 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Stripe and GoCardless processing fees apply separately and are not included in the platform fee.
      </p>
    </div>
  );
}
