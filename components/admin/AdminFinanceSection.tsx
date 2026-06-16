import { DashboardStatCard } from "@/components/club/dashboard/DashboardCards";
import { PageHeader } from "@/components/club/PageHeader";
import {
  MOCK_FINANCE_SUMMARY,
  MOCK_PLATFORM_FEES_BY_PROVIDER,
} from "@/lib/admin";
import dynamic from "next/dynamic";
import { AdminStripePlatformCard } from "./AdminStripePlatformCard";

const AdminPaymentProvidersSection = dynamic(
  () =>
    import("./finance/AdminPaymentProvidersSection").then(
      (m) => m.AdminPaymentProvidersSection,
    ),
  { ssr: false },
);

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function AdminFinanceSection() {
  const finance = MOCK_FINANCE_SUMMARY;
  const vatProgress = Math.min(
    100,
    Math.round(
      (finance.rollingTwelveMonthRevenue / finance.vatThreshold) * 100,
    ),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Finance"
        description="Platform revenue, Stripe fees, payouts, and VAT monitoring for Activora."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label="Platform fee"
          value={`${finance.platformFeePercent}%`}
          hint="Default marketplace fee (admin-only)"
          accent="violet"
        />
        <DashboardStatCard
          label="Fees earned"
          value={formatCurrency(finance.totalPlatformFeesEarned)}
          hint="Activora platform revenue"
          accent="teal"
        />
        <DashboardStatCard
          label="Pending payouts"
          value={formatCurrency(finance.pendingPayouts)}
          hint="Queued for provider transfer"
          accent="amber"
        />
        <DashboardStatCard
          label="Open disputes"
          value={String(finance.openDisputes)}
          hint="Requires review"
          accent="rose"
        />
      </section>

      <AdminStripePlatformCard />

      <AdminPaymentProvidersSection />

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">
            VAT threshold monitoring
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Rolling 12-month platform revenue vs UK VAT threshold (£
            {finance.vatThreshold.toLocaleString("en-GB")}).
          </p>
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-zinc-700">
                {formatCurrency(finance.rollingTwelveMonthRevenue)}
              </span>
              <span className="text-zinc-500">{vatProgress}% of threshold</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-violet-600 transition-all"
                style={{ width: `${vatProgress}%` }}
              />
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">
            Payment health
          </h2>
          <dl className="mt-4 space-y-3">
            {[
              ["Stripe processing fees", formatCurrency(finance.stripePlatformFees)],
              ["Refunds (30d)", formatCurrency(finance.refunds)],
              ["Failed payments (30d)", String(finance.failedPayments)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between border-b border-zinc-100 pb-3 last:border-0"
              >
                <dt className="text-sm text-zinc-600">{label}</dt>
                <dd className="text-sm font-semibold text-zinc-900">{value}</dd>
              </div>
            ))}
          </dl>
        </article>
      </div>

      <article className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-5">
          <h2 className="text-lg font-semibold text-zinc-900">
            Platform fees by provider
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Providers cannot change the platform fee — admin control only.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-100">
            <thead>
              <tr className="bg-zinc-50/80">
                {["Provider", "Bookings", "Gross revenue", "Platform fees"].map(
                  (heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {MOCK_PLATFORM_FEES_BY_PROVIDER.map((row) => (
                <tr key={row.providerId} className="hover:bg-zinc-50/50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-zinc-900">
                    {row.clubName}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-700">
                    {row.bookings.toLocaleString("en-GB")}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-700">
                    {formatCurrency(row.grossRevenue)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-violet-700">
                    {formatCurrency(row.platformFees)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
