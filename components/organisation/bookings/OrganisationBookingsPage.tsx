"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/club/EmptyState";
import { LoadingState } from "@/components/club/LoadingState";
import { PageHeader } from "@/components/club/PageHeader";
import { DashboardStatCard } from "@/components/club/dashboard/DashboardCards";
import {
  OrgActionLink,
  OrgFilterField,
  OrgFilterPanel,
  OrgStatusBadge,
  OrgTable,
  OrgTableWrapper,
  OrgToast,
  orgInputClass,
  orgSelectClass,
} from "@/components/organisation/shared/OrgUi";
import { PaginationControls } from "@/components/ui/PaginationControls";
import {
  DEFAULT_ORG_BOOKING_FILTERS,
  filterOrgBookings,
  formatOrgCurrency,
  formatOrgDate,
  getOrgBookingFilterOptions,
  getOrgBookingMetrics,
  getOrgBookings,
  type OrgBooking,
  type OrgBookingFilters,
} from "@/lib/organisation";
import { paginateItems } from "@/lib/pagination";

function paymentTone(
  status: OrgBooking["paymentStatus"],
): "emerald" | "amber" | "rose" | "zinc" {
  if (status === "paid") return "emerald";
  if (status === "pending") return "amber";
  if (status === "refunded" || status === "failed") return "rose";
  return "amber";
}

function bookingTone(
  status: OrgBooking["bookingStatus"],
): "emerald" | "amber" | "rose" | "zinc" {
  if (status === "confirmed") return "emerald";
  if (status === "pending") return "amber";
  if (status === "cancelled") return "rose";
  return "amber";
}

export function OrganisationBookingsPage() {
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<OrgBookingFilters>(
    DEFAULT_ORG_BOOKING_FILTERS,
  );
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [bookings, setBookings] = useState<OrgBooking[]>([]);

  const metrics = useMemo(() => getOrgBookingMetrics(bookings), [bookings]);
  const filterOptions = useMemo(
    () => getOrgBookingFilterOptions(bookings),
    [bookings],
  );

  const filtered = useMemo(
    () => filterOrgBookings(bookings, filters),
    [bookings, filters],
  );

  const pagination = useMemo(
    () => paginateItems(filtered, page, 8),
    [filtered, page],
  );

  useEffect(() => {
    setBookings(getOrgBookings());
    setLoading(false);
  }, []);

  function updateFilter<K extends keyof OrgBookingFilters>(
    key: K,
    value: OrgBookingFilters[K],
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  function stubAction(label: string) {
    setMessage(`${label} (demo action).`);
  }

  if (loading) {
    return <LoadingState message="Loading network bookings..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        description="Monitor bookings, payments, and cancellations across your franchise network."
      />

      <OrgToast message={message} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <DashboardStatCard
          label="Total bookings"
          value={String(metrics.total)}
          hint="All franchisee clubs"
          accent="violet"
        />
        <DashboardStatCard
          label="This month"
          value={String(metrics.thisMonth)}
          hint="Session dates in June"
          accent="teal"
        />
        <DashboardStatCard
          label="Revenue"
          value={formatOrgCurrency(metrics.revenuePence)}
          hint="Paid bookings"
          accent="slate"
        />
        <DashboardStatCard
          label="Refunds"
          value={String(metrics.refunds)}
          hint="Full or partial"
          accent="amber"
        />
        <DashboardStatCard
          label="Cancelled"
          value={String(metrics.cancelled)}
          hint="Booking status"
          accent="rose"
        />
      </div>

      <OrgFilterPanel>
        <OrgFilterField label="Search" className="sm:col-span-2">
          <input
            type="search"
            value={filters.query}
            onChange={(e) => updateFilter("query", e.target.value)}
            placeholder="Parent, child, reference, activity"
            className={orgInputClass}
          />
        </OrgFilterField>
        <OrgFilterField label="Franchisee club">
          <select
            value={filters.clubId}
            onChange={(e) => updateFilter("clubId", e.target.value)}
            className={orgSelectClass}
          >
            <option value="all">All clubs</option>
            {filterOptions.clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
        </OrgFilterField>
        <OrgFilterField label="Payment status">
          <select
            value={filters.paymentStatus}
            onChange={(e) =>
              updateFilter(
                "paymentStatus",
                e.target.value as OrgBookingFilters["paymentStatus"],
              )
            }
            className={orgSelectClass}
          >
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
            <option value="partial_refund">Partial refund</option>
            <option value="failed">Failed</option>
          </select>
        </OrgFilterField>
        <OrgFilterField label="Booking status">
          <select
            value={filters.bookingStatus}
            onChange={(e) =>
              updateFilter(
                "bookingStatus",
                e.target.value as OrgBookingFilters["bookingStatus"],
              )
            }
            className={orgSelectClass}
          >
            <option value="all">All</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
            <option value="refund_requested">Refund requested</option>
          </select>
        </OrgFilterField>
      </OrgFilterPanel>

      {bookings.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          description="Bookings from franchisee clubs will appear here."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matching bookings"
          description="Try adjusting your filters to see more results."
        />
      ) : (
        <OrgTableWrapper
          pagination={
            <PaginationControls
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
              onPageChange={setPage}
            />
          }
        >
          <OrgTable
            columns={[
              "Parent / carer",
              "Child",
              "Franchisee club",
              "Activity",
              "Session date",
              "Payment status",
              "Booking status",
              "Amount",
              "Actions",
            ]}
          >
            {pagination.items.map((booking) => (
              <tr key={booking.id} className="hover:bg-zinc-50/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-900">{booking.parentName}</p>
                  <p className="text-xs text-zinc-500">{booking.reference}</p>
                </td>
                <td className="px-4 py-3 text-zinc-600">{booking.childName}</td>
                <td className="px-4 py-3 text-zinc-600">
                  {booking.franchiseeClubName}
                </td>
                <td className="px-4 py-3 text-zinc-600">{booking.activityTitle}</td>
                <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                  {formatOrgDate(booking.sessionDate)}
                </td>
                <td className="px-4 py-3">
                  <OrgStatusBadge
                    label={booking.paymentStatus}
                    tone={paymentTone(booking.paymentStatus)}
                  />
                </td>
                <td className="px-4 py-3">
                  <OrgStatusBadge
                    label={booking.bookingStatus}
                    tone={bookingTone(booking.bookingStatus)}
                  />
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {formatOrgCurrency(booking.amountPence)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex min-w-[200px] flex-wrap gap-x-2 gap-y-1">
                    <OrgActionLink onClick={() => stubAction(`View ${booking.reference}`)}>
                      View
                    </OrgActionLink>
                    <OrgActionLink onClick={() => stubAction("Refund booking")}>
                      Refund
                    </OrgActionLink>
                    <OrgActionLink onClick={() => stubAction("Cancel session")}>
                      Cancel session
                    </OrgActionLink>
                    <OrgActionLink onClick={() => stubAction(`Message ${booking.parentName}`)}>
                      Message parent
                    </OrgActionLink>
                  </div>
                </td>
              </tr>
            ))}
          </OrgTable>
        </OrgTableWrapper>
      )}
    </div>
  );
}
