import { DashboardStatCard } from "@/components/club/dashboard/DashboardCards";
import { PageHeader } from "@/components/club/PageHeader";
import { MOCK_OVERVIEW_METRICS } from "@/lib/admin";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
}

export function AdminOverview() {
  const metrics = MOCK_OVERVIEW_METRICS;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Overview"
        description="Platform-wide metrics across providers, bookings, revenue, and support."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label="Total providers"
          value={formatCount(metrics.totalProviders)}
          hint="Active clubs on Activora"
          accent="violet"
          growth={{ value: 8, direction: "up", label: "vs last month" }}
        />
        <DashboardStatCard
          label="Total bookings"
          value={formatCount(metrics.totalBookings)}
          hint="All-time session bookings"
          accent="amber"
          growth={{ value: 6, direction: "up", label: "vs last month" }}
        />
        <DashboardStatCard
          label="Platform revenue"
          value={formatCurrency(metrics.platformRevenue)}
          hint="Activora marketplace fees earned"
          accent="teal"
        />
        <DashboardStatCard
          label="Open support messages"
          value={formatCount(metrics.openSupportMessages)}
          hint="Conversations awaiting response"
          accent="rose"
        />
      </section>

      <article className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Quick actions</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Common admin tasks — full workflows coming with live auth.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {[
            "Review pending verifications",
            "Check Stripe Connect status",
            "Export finance report",
            "Review failed payments",
          ].map((action) => (
            <button
              key={action}
              type="button"
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              {action}
            </button>
          ))}
        </div>
      </article>
    </div>
  );
}
