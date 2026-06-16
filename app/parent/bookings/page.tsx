"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/club/EmptyState";
import { LoadingState } from "@/components/club/LoadingState";
import { PageHeader } from "@/components/club/PageHeader";
import { StatusBadge } from "@/components/club/StatusBadge";
import { ReviewPrompt } from "@/components/reviews/ReviewPrompt";
import {
  Booking,
  getBookings,
  getTotalSpent,
  requestRefund,
  statusLabels,
} from "@/lib/bookings";
import { formatCurrency, formatDay, formatTimeRange } from "@/lib/sessions";

export default function ParentBookingsPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalSpent, setTotalSpent] = useState("£0");

  function loadBookings() {
    const all = [...getBookings()].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    setBookings(all);
    setTotalSpent(formatCurrency(getTotalSpent(all)));
    setLoading(false);
  }

  useEffect(() => {
    loadBookings();
  }, []);

  function handleRefund(bookingId: string) {
    requestRefund(bookingId);
    loadBookings();
  }

  function handleContactProvider(booking: Booking) {
    window.location.href = `mailto:support@activora.com?subject=Booking enquiry: ${encodeURIComponent(booking.sessionTitle)}&body=Booking ID: ${booking.id}`;
  }

  if (loading) {
    return <LoadingState message="Loading bookings..." />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Bookings"
        description="View all your session bookings and manage refund requests."
      />

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-zinc-500">Total amount spent</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
          {totalSpent}
        </p>
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          description="When you book a session, it will appear here."
          actionLabel="Browse sessions"
          actionHref="/sessions"
        />
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <article
              key={booking.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold text-zinc-900">
                      {booking.sessionTitle}
                    </h2>
                    <StatusBadge status={booking.status} />
                  </div>
                  <dl className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <dt className="text-zinc-500">Child</dt>
                      <dd className="font-medium text-zinc-900">
                        {booking.childName}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500">Provider / club</dt>
                      <dd className="font-medium text-zinc-900">
                        {booking.providerName}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500">Day</dt>
                      <dd className="font-medium text-zinc-900">
                        {formatDay(booking.day)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500">Time</dt>
                      <dd className="font-medium text-zinc-900">
                        {formatTimeRange(booking.startTime, booking.endTime)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500">Price paid</dt>
                      <dd className="font-medium text-zinc-900">
                        {formatCurrency(booking.pricePaid)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500">Status</dt>
                      <dd className="font-medium text-zinc-900">
                        {statusLabels[booking.status]}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleContactProvider(booking)}
                    className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                  >
                    Contact Provider
                  </button>
                  {booking.status !== "refund_requested" &&
                  booking.status !== "cancelled" ? (
                    <button
                      type="button"
                      onClick={() => handleRefund(booking.id)}
                      className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      Request Refund
                    </button>
                  ) : null}
                </div>
              </div>
              {booking.status === "confirmed" ? (
                <ReviewPrompt
                  bookingId={booking.id}
                  attended
                />
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
