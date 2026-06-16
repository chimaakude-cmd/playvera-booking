"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { EmptyState } from "@/components/club/EmptyState";
import { LoadingState } from "@/components/club/LoadingState";
import { PageHeader } from "@/components/club/PageHeader";
import { StatusBadge } from "@/components/club/StatusBadge";
import { Booking, BookingStatus, getBookings, updateBookingStatus } from "@/lib/bookings";

function BookingsContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showUpdated, setShowUpdated] = useState(false);

  function loadBookings() {
    setBookings(
      [...getBookings()].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    );
    setLoading(false);
  }

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    if (searchParams.get("updated") === "1") {
      setShowUpdated(true);
      window.history.replaceState({}, "", "/club/bookings");
    }
  }, [searchParams]);

  function handleStatusChange(bookingId: string, status: BookingStatus) {
    updateBookingStatus(bookingId, status);
    loadBookings();
  }

  if (loading) {
    return <LoadingState message="Loading bookings..." />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Bookings"
        description="Review and manage booking requests from parents."
      />

      {showUpdated ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Booking status updated
        </div>
      ) : null}

      {bookings.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          description="When parents book your sessions, they'll appear here for you to review."
          actionLabel="View Sessions"
          actionHref="/club/activities"
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-500">
                  <th className="px-6 py-3 font-medium">Session</th>
                  <th className="px-6 py-3 font-medium">Child</th>
                  <th className="px-6 py-3 font-medium">Parent</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-zinc-100 last:border-b-0"
                  >
                    <td className="px-6 py-4 font-medium text-zinc-900">
                      {booking.sessionTitle}
                    </td>
                    <td className="px-6 py-4 text-zinc-600">
                      {booking.childName}
                    </td>
                    <td className="px-6 py-4 text-zinc-600">
                      {booking.parentName}
                    </td>
                    <td className="px-6 py-4 text-zinc-600">{booking.email}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {booking.status !== "confirmed" ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(booking.id, "confirmed")
                            }
                            className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-50"
                          >
                            Confirm
                          </button>
                        ) : null}
                        {booking.status !== "cancelled" ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(booking.id, "cancelled")
                            }
                            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
                          >
                            Cancel
                          </button>
                        ) : null}
                        {booking.status !== "pending" ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(booking.id, "pending")
                            }
                            className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-50"
                          >
                            Mark Pending
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClubBookingsPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading bookings..." />}>
      <BookingsContent />
    </Suspense>
  );
}
