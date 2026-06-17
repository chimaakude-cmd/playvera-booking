import { DashboardStatCard } from "@/components/club/dashboard/DashboardCards";
import { EstimatedPlatformRevenueSection } from "@/components/admin/EstimatedPlatformRevenueSection";
import { PageHeader } from "@/components/club/PageHeader";
import type { AdminDashboardData } from "@/lib/admin/dashboard-data";
import {
  formatPaymentsStatusLabel,
  formatRecentSignupsStatusLabel,
  formatSupabaseMetricsStatusLabel,
  type AdminStatusBadgeLabel,
} from "@/lib/admin/data-source";
import { formatMoney } from "@/lib/payments";

type Props = {
  data: AdminDashboardData;
};

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
}

function DataStatusBadge({ label }: { label: AdminStatusBadgeLabel }) {
  const isLive = label === "Live data";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        isLive
          ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
          : "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200"
      }`}
    >
      {label}
    </span>
  );
}

function SectionHeader({
  title,
  description,
  label,
}: {
  title: string;
  description: string;
  label: AdminStatusBadgeLabel;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      </div>
      <DataStatusBadge label={label} />
    </div>
  );
}

function paymentsOverviewDescription(data: AdminDashboardData): string {
  if (!data.supabaseConfigured) {
    return "Add Supabase env vars and redeploy to surface booking and payment metrics.";
  }

  if (!data.stripeConfigured) {
    return "Connect Stripe to surface payment volume and platform fees.";
  }

  if (data.platformRevenue.hasLivePaymentData) {
    return "Live booking and payment metrics from Supabase.";
  }

  return "Stripe and Supabase are configured — metrics will appear once bookings are recorded.";
}

export function AdminTestDashboardContent({ data }: Props) {
  const { metrics, platformRevenue } = data;
  const showPaymentVolume =
    data.supabaseConfigured &&
    data.stripeConfigured &&
    platformRevenue.hasLivePaymentData;
  const metricsStatusLabel = formatSupabaseMetricsStatusLabel(
    data.supabaseConfigured,
  );
  const recentSignupsStatusLabel = formatRecentSignupsStatusLabel({
    supabaseConfigured: data.supabaseConfigured,
    status: data.recentSignupsStatus,
  });
  const paymentsStatusLabel = formatPaymentsStatusLabel({
    supabaseConfigured: data.supabaseConfigured,
    stripeConfigured: data.stripeConfigured,
    hasLivePaymentData: platformRevenue.hasLivePaymentData,
  });
  const showBookingsCount = data.supabaseConfigured;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Dashboard"
        description="Platform overview from connected data sources."
      />

      <section className="space-y-4">
        <div className="flex justify-end">
          <DataStatusBadge label={metricsStatusLabel} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <DashboardStatCard
            label="Total clubs"
            value={formatCount(metrics.totalClubs)}
            hint="Registered club providers"
            accent="violet"
          />
          <DashboardStatCard
            label="Total customers"
            value={formatCount(metrics.totalCustomers)}
            hint="Parent accounts on platform"
            accent="teal"
          />
          <DashboardStatCard
            label="Club profiles"
            value={formatCount(metrics.clubProfiles)}
            hint="Published club listings"
            accent="amber"
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Recent signups"
            description="Latest clubs joining Activora."
            label={recentSignupsStatusLabel}
          />
          {data.recentSignups.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {data.recentSignups.map((signup) => (
                <li
                  key={signup.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm"
                >
                  <span className="font-medium text-zinc-800">{signup.name}</span>
                  <span className="text-zinc-500">{signup.joinedLabel}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
              {data.supabaseConfigured
                ? "No provider signups yet."
                : "Supabase not configured"}
            </p>
          )}
        </article>

        <article className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Payments &amp; bookings overview"
            description={paymentsOverviewDescription(data)}
            label={paymentsStatusLabel}
          />
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Bookings (30d)
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-zinc-900">
                {showBookingsCount
                  ? formatCount(metrics.bookingsLast30Days)
                  : "No data yet"}
              </dd>
            </div>
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Platform fees (30d est.)
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-zinc-900">
                {showPaymentVolume
                  ? formatMoney(platformRevenue.totalEstimatedRevenue)
                  : "No data yet"}
              </dd>
            </div>
          </dl>
        </article>
      </section>

      <EstimatedPlatformRevenueSection
        summary={platformRevenue}
        supabaseConfigured={data.supabaseConfigured}
      />

      <article className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Admin controls</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Placeholder for user management, verification, and platform settings.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {[
            "Manage club verifications",
            "Review support inbox",
            "Configure platform fees",
            "Export audit log",
          ].map((action) => (
            <button
              key={action}
              type="button"
              disabled
              className="cursor-not-allowed rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-500 opacity-70"
            >
              {action}
            </button>
          ))}
        </div>
      </article>
    </div>
  );
}
