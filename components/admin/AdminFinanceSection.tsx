"use client";

import { DashboardStatCard } from "@/components/club/dashboard/DashboardCards";
import { EstimatedPlatformRevenueSection } from "@/components/admin/EstimatedPlatformRevenueSection";
import { PageHeader } from "@/components/club/PageHeader";
import {
  adminEnvMissingLabel,
  adminLiveDataLabel,
} from "@/lib/admin/data-source";
import type { AdminFinanceData } from "@/lib/admin/finance-data";
import dynamic from "next/dynamic";
import { AdminStripePlatformCard } from "./AdminStripePlatformCard";
import { AdminGoCardlessSetupSection } from "./finance/AdminGoCardlessSetupSection";
import { AdminPaymentEventLogSection } from "./finance/AdminPaymentEventLogSection";
import { AdminPaymentModeBanner } from "./finance/AdminPaymentModeBanner";

const AdminPaymentProvidersSection = dynamic(
  () =>
    import("./finance/AdminPaymentProvidersSection").then(
      (m) => m.AdminPaymentProvidersSection,
    ),
  { ssr: false },
);

type Props = { data: AdminFinanceData };

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function AdminFinanceSection({ data }: Props) {
  const { platformRevenue, feesByProvider, dataSource } = data;
  const showLiveFees =
    platformRevenue.status === "live" && platformRevenue.hasLivePaymentData;
  const totalPlatformFees = showLiveFees
    ? platformRevenue.totalEstimatedRevenue
    : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Finance"
        description="Platform revenue and fee breakdown from live booking data."
        action={
          dataSource === "env_missing" ? (
            <span className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800">
              {adminEnvMissingLabel()}
            </span>
          ) : (
            <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800">
              {adminLiveDataLabel()}
            </span>
          )
        }
      />

      <AdminPaymentModeBanner />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label="Platform fees (30d est.)"
          value={formatCurrency(totalPlatformFees)}
          hint="Estimated from booking volume"
          accent="violet"
        />
        <DashboardStatCard
          label="Booking volume (30d)"
          value={formatCurrency(showLiveFees ? platformRevenue.totalMonthlyVolume : 0)}
          hint="Paid bookings across providers"
          accent="teal"
        />
        <DashboardStatCard
          label="Providers with fees"
          value={String(feesByProvider.length)}
          hint="Providers with paid bookings (30d)"
          accent="amber"
        />
        <DashboardStatCard
          label="Projected annual fees"
          value={formatCurrency(totalPlatformFees * 12)}
          hint="Monthly estimate × 12"
          accent="rose"
        />
      </section>

      <EstimatedPlatformRevenueSection
        summary={platformRevenue}
        supabaseConfigured={dataSource !== "env_missing"}
      />
      <AdminStripePlatformCard />
      <AdminGoCardlessSetupSection embedded />
      <AdminPaymentProvidersSection />
      <AdminPaymentEventLogSection embedded />

      <article className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-5">
          <h2 className="text-lg font-semibold text-zinc-900">
            Platform fees by provider
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Last 30 days — real data only.
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
                      className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {feesByProvider.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-zinc-500">
                    {showLiveFees ? "No provider fee data yet." : "No live payment data yet."}
                  </td>
                </tr>
              ) : (
                feesByProvider.map((row) => (
                  <tr key={row.providerId} className="hover:bg-zinc-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-zinc-900">{row.clubName}</td>
                    <td className="px-6 py-4 text-sm text-zinc-700">{row.bookings.toLocaleString("en-GB")}</td>
                    <td className="px-6 py-4 text-sm text-zinc-700">{formatCurrency(row.grossRevenue)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-violet-700">{formatCurrency(row.platformFees)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
