import type { PlatformRevenueSummary } from "@/lib/admin/platform-revenue-data";
import { formatPlatformRevenueStatusLabel } from "@/lib/admin/data-source";
import { formatMoney } from "@/lib/payments";

type Props = {
  summary: PlatformRevenueSummary;
  supabaseConfigured: boolean;
};

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
}

function formatPercent(value: number): string {
  return `${value.toLocaleString("en-GB", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  })}%`;
}

export function EstimatedPlatformRevenueSection({
  summary,
  supabaseConfigured,
}: Props) {
  const showLiveData =
    supabaseConfigured && summary.status === "live" && summary.hasLivePaymentData;
  const statusLabel = formatPlatformRevenueStatusLabel({
    supabaseConfigured,
    status: summary.status,
    hasLivePaymentData: summary.hasLivePaymentData,
  });

  return (
    <article className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">
            Estimated monthly platform revenue
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Last 30 days of booking volume by account type, using platform fee
            rates from pricing.
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            showLiveData
              ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
              : "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200"
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-xs font-medium uppercase tracking-wide text-zinc-500">
              <th className="py-3 pr-4 font-medium">Account type</th>
              <th className="py-3 pr-4 font-medium">Active accounts</th>
              <th className="py-3 pr-4 font-medium">Monthly booking volume</th>
              <th className="py-3 pr-4 font-medium">Platform fee</th>
              <th className="py-3 font-medium">Estimated revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {summary.tiers.map((tier) => (
              <tr key={tier.id}>
                <td className="py-3 pr-4 font-medium text-zinc-900">
                  {tier.label}
                </td>
                <td className="py-3 pr-4 text-zinc-700">
                  {formatCount(tier.activeAccounts)}
                </td>
                <td className="py-3 pr-4 text-zinc-700">
                  {showLiveData
                    ? formatMoney(tier.monthlyBookingVolume)
                    : formatMoney(0)}
                </td>
                <td className="py-3 pr-4 text-zinc-700">
                  {formatPercent(tier.feePercent)}
                </td>
                <td className="py-3 font-medium text-zinc-900">
                  {showLiveData
                    ? formatMoney(tier.estimatedRevenue)
                    : formatMoney(0)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-zinc-200">
              <td className="py-3 pr-4 font-semibold text-zinc-900">Total</td>
              <td className="py-3 pr-4 text-zinc-500">—</td>
              <td className="py-3 pr-4 font-semibold text-zinc-900">
                {showLiveData
                  ? formatMoney(summary.totalMonthlyVolume)
                  : formatMoney(0)}
              </td>
              <td className="py-3 pr-4 text-zinc-500">—</td>
              <td className="py-3 font-semibold text-zinc-900">
                {showLiveData
                  ? formatMoney(summary.totalEstimatedRevenue)
                  : formatMoney(0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {!showLiveData && supabaseConfigured ? (
        <p className="mt-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
          No live payment data yet.
        </p>
      ) : null}
    </article>
  );
}
