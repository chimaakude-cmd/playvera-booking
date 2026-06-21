"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { DemoDataBadge } from "@/components/club/DemoDataBadge";
import { EmptyState } from "@/components/club/EmptyState";
import { PageHeader } from "@/components/club/PageHeader";
import { DashboardStatCard } from "@/components/club/dashboard/DashboardCards";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { getCurrentClubRole, roleHasPermission } from "@/lib/club-team";
import {
  filterCustomers,
  getClubCustomers,
  getCustomerFilterOptions,
  getCustomerMetrics,
  type ClubCustomer,
  type CustomerFilters,
  type CustomerPaymentStatus,
} from "@/lib/club-customers";
import type { BookingStatus } from "@/lib/bookings";
import { formatMoney } from "@/lib/payments";
import { paginateItems } from "@/lib/pagination";
import { isClubDemoRoute } from "@/lib/club-demo-mode";
import { CustomerDetailDrawer } from "./CustomerDetailDrawer";

const PAYMENT_STATUS_LABELS: Record<CustomerPaymentStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  refunded: "Refunded",
  partial_refund: "Partial refund",
  failed: "Failed",
  refund_requested: "Refund requested",
};

function paymentTone(status: CustomerPaymentStatus) {
  if (status === "paid") return "text-emerald-700 bg-emerald-50";
  if (status === "refund_requested" || status === "partial_refund") {
    return "text-amber-800 bg-amber-50";
  }
  if (status === "refunded" || status === "failed") {
    return "text-rose-700 bg-rose-50";
  }
  return "text-zinc-600 bg-zinc-100";
}

export function CustomersPage() {
  const pathname = usePathname();
  const isDemoExperience = isClubDemoRoute(pathname);
  const role = getCurrentClubRole();
  const canManage = roleHasPermission(role, "manage_bookings");

  const [refreshKey, setRefreshKey] = useState(0);
  const customers = useMemo(() => {
    void refreshKey;
    return getClubCustomers();
  }, [refreshKey]);

  const metrics = useMemo(() => getCustomerMetrics(customers), [customers]);
  const filterOptions = useMemo(
    () => getCustomerFilterOptions(customers),
    [customers],
  );

  const [filters, setFilters] = useState<CustomerFilters>({
    query: "",
    activity: "all",
    venue: "all",
    bookingStatus: "all",
    paymentStatus: "all",
  });
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<ClubCustomer | null>(
    null,
  );

  const filtered = useMemo(
    () => filterCustomers(customers, filters),
    [customers, filters],
  );

  const pagination = useMemo(
    () => paginateItems(filtered, page, 8),
    [filtered, page],
  );

  function updateFilter<K extends keyof CustomerFilters>(
    key: K,
    value: CustomerFilters[K],
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage parents, children, bookings, cancellations, and refunds in one CRM view."
        action={isDemoExperience ? <DemoDataBadge /> : undefined}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <DashboardStatCard
          label="Total customers"
          value={String(metrics.totalCustomers)}
          hint="Unique parent/carer accounts"
          accent="teal"
        />
        <DashboardStatCard
          label="Active customers"
          value={String(metrics.activeCustomers)}
          hint="Confirmed or pending bookings"
          accent="violet"
        />
        <DashboardStatCard
          label="Total children"
          value={String(metrics.totalChildren)}
          hint="Linked child profiles"
          accent="slate"
        />
        <DashboardStatCard
          label="Repeat customers"
          value={String(metrics.repeatCustomers)}
          hint="More than one booking"
          accent="amber"
        />
        <DashboardStatCard
          label="Average spend"
          value={formatMoney(metrics.averageSpend)}
          hint="Per customer lifetime"
          accent="teal"
        />
        <DashboardStatCard
          label="Outstanding issues"
          value={String(metrics.outstandingIssues)}
          hint="Refunds or cancellations"
          accent="rose"
        />
      </div>

      {customers.length === 0 ? (
        <EmptyState
          title="No customers yet"
          description="When parents book your activities, their profiles and booking history will appear here."
          actionLabel="View activities"
          actionHref="/club/activities"
        />
      ) : (
        <>
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-6">
              <label className="block text-xs font-medium text-zinc-500 lg:col-span-2">
                Search parent, child, email, or phone
                <input
                  type="search"
                  value={filters.query}
                  onChange={(e) => updateFilter("query", e.target.value)}
                  placeholder="Search by name, email, or phone"
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
                />
              </label>
              <label className="block text-xs font-medium text-zinc-500">
                Activity
                <select
                  value={filters.activity}
                  onChange={(e) => updateFilter("activity", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
                >
                  <option value="all">All activities</option>
                  {filterOptions.activities.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-zinc-500">
                Venue
                <select
                  value={filters.venue}
                  onChange={(e) => updateFilter("venue", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
                >
                  <option value="all">All venues</option>
                  {filterOptions.venues.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-zinc-500">
                Booking status
                <select
                  value={filters.bookingStatus}
                  onChange={(e) =>
                    updateFilter(
                      "bookingStatus",
                      e.target.value as BookingStatus | "all" | "mixed",
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
                >
                  <option value="all">All</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refund_requested">Refund requested</option>
                  <option value="mixed">Mixed</option>
                </select>
              </label>
              <label className="block text-xs font-medium text-zinc-500">
                Payment status
                <select
                  value={filters.paymentStatus}
                  onChange={(e) =>
                    updateFilter(
                      "paymentStatus",
                      e.target.value as CustomerPaymentStatus | "all",
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
                >
                  <option value="all">All</option>
                  {(Object.keys(PAYMENT_STATUS_LABELS) as CustomerPaymentStatus[]).map(
                    (status) => (
                      <option key={status} value={status}>
                        {PAYMENT_STATUS_LABELS[status]}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="No matching customers"
              description="Try adjusting your filters to see more results."
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-zinc-50/80 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    <tr>
                      <th className="px-4 py-3">Parent / carer</th>
                      <th className="px-4 py-3">Children</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Latest booking</th>
                      <th className="px-4 py-3">Bookings</th>
                      <th className="px-4 py-3">Spend</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {pagination.items.map((customer) => (
                      <tr
                        key={customer.id}
                        className="align-top hover:bg-zinc-50/50"
                      >
                        <td className="px-4 py-4 font-medium text-zinc-900">
                          {customer.parentName}
                          {customer.hasMedicalNotes ? (
                            <span
                              className="ml-2 text-xs text-rose-600"
                              title="Medical notes on file"
                            >
                              ⚕
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 text-zinc-700">
                          {customer.childNamesLabel}
                        </td>
                        <td className="px-4 py-4 text-zinc-600">{customer.email}</td>
                        <td className="px-4 py-4 text-zinc-700">{customer.phone}</td>
                        <td className="px-4 py-4 text-zinc-600">
                          {customer.latestBooking}
                        </td>
                        <td className="px-4 py-4 text-zinc-900">
                          {customer.totalBookings}
                        </td>
                        <td className="px-4 py-4 font-semibold text-zinc-900">
                          {formatMoney(customer.totalSpend)}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${paymentTone(customer.paymentStatus)}`}
                          >
                            {PAYMENT_STATUS_LABELS[customer.paymentStatus]}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomer(customer)}
                            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                          >
                            View profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls
                page={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                startIndex={pagination.startIndex}
                endIndex={pagination.endIndex}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      <CustomerDetailDrawer
        customer={selectedCustomer}
        canManage={canManage}
        onClose={() => setSelectedCustomer(null)}
        onUpdated={() => {
          setRefreshKey((k) => k + 1);
          const updated = getClubCustomers().find(
            (c) => c.id === selectedCustomer?.id,
          );
          if (updated) setSelectedCustomer(updated);
        }}
      />
    </div>
  );
}
