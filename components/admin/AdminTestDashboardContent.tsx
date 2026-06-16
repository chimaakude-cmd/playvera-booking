import { DashboardStatCard } from "@/components/club/dashboard/DashboardCards";
import { PageHeader } from "@/components/club/PageHeader";
import { MOCK_OVERVIEW_METRICS } from "@/lib/admin";

const RECENT_SIGNUPS = [
  { name: "Riverside FC Academy", joined: "2 days ago" },
  { name: "Little Kickers Leeds", joined: "5 days ago" },
  { name: "North Star Gymnastics", joined: "1 week ago" },
];

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
}

export function AdminTestDashboardContent() {
  const metrics = MOCK_OVERVIEW_METRICS;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm text-amber-950 ring-1 ring-amber-200">
        Test admin access only — replace with secure authentication before
        production.
      </div>

      <PageHeader
        title="Admin Dashboard"
        description="Temporary test overview — metrics shown are placeholders until live data is wired."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <DashboardStatCard
          label="Total clubs"
          value={formatCount(metrics.totalProviders)}
          hint="Registered club providers"
          accent="violet"
        />
        <DashboardStatCard
          label="Total customers"
          value="1,842"
          hint="Parent accounts on platform"
          accent="teal"
        />
        <DashboardStatCard
          label="Club profiles"
          value={formatCount(metrics.totalProviders)}
          hint="Published club listings"
          accent="amber"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Recent signups</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Latest clubs joining Activora (demo data).
          </p>
          <ul className="mt-4 space-y-3">
            {RECENT_SIGNUPS.map((signup) => (
              <li
                key={signup.name}
                className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm"
              >
                <span className="font-medium text-zinc-800">{signup.name}</span>
                <span className="text-zinc-500">{signup.joined}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">
            Payments &amp; bookings overview
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Placeholder for Stripe Connect volume and booking trends.
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Bookings (30d)
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-zinc-900">
                {formatCount(metrics.totalBookings)}
              </dd>
            </div>
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Platform fees
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-zinc-900">
                £{formatCount(metrics.platformRevenue)}
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
