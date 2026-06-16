import { DashboardStatCard } from "@/components/club/dashboard/DashboardCards";
import { PageHeader } from "@/components/club/PageHeader";
import type { AdminDashboardData } from "@/lib/admin/dashboard-data";
import { formatAdminDataStatusLabel } from "@/lib/admin/dashboard-data";

type Props = {
  data: AdminDashboardData;
};

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
}

function DataStatusBadge({
  status,
}: {
  status: AdminDashboardData["platformMetricsStatus"];
}) {
  const isLive = status === "live";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        isLive
          ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
          : "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200"
      }`}
    >
      {formatAdminDataStatusLabel(status)}
    </span>
  );
}

function SectionHeader({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status: AdminDashboardData["platformMetricsStatus"];
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      </div>
      <DataStatusBadge status={status} />
    </div>
  );
}

export function AdminTestDashboardContent({ data }: Props) {
  const { metrics } = data;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm text-amber-950 ring-1 ring-amber-200">
        Test admin access only — replace with secure authentication before
        production.
      </div>

      <PageHeader
        title="Admin Dashboard"
        description="Platform overview from connected data sources."
      />

      <section className="space-y-4">
        <div className="flex justify-end">
          <DataStatusBadge status={data.platformMetricsStatus} />
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
            status={data.recentSignupsStatus}
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
              No data yet
            </p>
          )}
        </article>

        <article className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Payments &amp; bookings overview"
            description={
              data.stripeConfigured
                ? "Stripe is configured — aggregate payment metrics will appear once the dashboard API is wired."
                : "Connect Stripe to surface payment volume and platform fees."
            }
            status={data.paymentsStatus}
          />
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Bookings (30d)
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-zinc-900">
                {data.platformMetricsStatus === "live"
                  ? formatCount(metrics.bookingsLast30Days)
                  : "No data yet"}
              </dd>
            </div>
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Platform fees
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-zinc-900">
                No data yet
              </dd>
            </div>
          </dl>
        </article>
      </section>

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
