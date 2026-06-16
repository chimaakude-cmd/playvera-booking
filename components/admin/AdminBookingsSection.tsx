"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/club/PageHeader";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { paginateItems } from "@/lib/pagination";
import {
  BOOKING_PAYMENT_STATUS_LABELS,
  type AdminBooking,
} from "@/lib/admin";

type Props = {
  bookings: AdminBooking[];
  dataSource: "supabase" | "unavailable";
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatSessionDate(value: string): string {
  if (!value) {
    return "—";
  }

  return new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function AdminBookingsSection({ bookings, dataSource }: Props) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return bookings;
    }
    return bookings.filter(
      (b) =>
        b.parentName.toLowerCase().includes(q) ||
        b.childName.toLowerCase().includes(q) ||
        b.activityTitle.toLowerCase().includes(q) ||
        b.providerName.toLowerCase().includes(q) ||
        b.reference.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q),
    );
  }, [bookings, query]);

  const pagination = useMemo(
    () => paginateItems(filtered, page, 8),
    [filtered, page],
  );

  function toggleExpand(booking: AdminBooking) {
    setExpandedId((current) => (current === booking.id ? null : booking.id));
    if (!notes[booking.id]) {
      setNotes((current) => ({ ...current, [booking.id]: booking.notes }));
    }
  }

  function handleStub(label: string, booking: AdminBooking) {
    window.alert(`${label} — stub for ${booking.reference}`);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Bookings"
        description="All bookings across the platform — search by parent, child, activity, or provider."
        action={
          dataSource === "unavailable" ? (
            <span className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800">
              Supabase not connected
            </span>
          ) : undefined
        }
      />

      <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
        <label className="block">
          <span className="text-xs font-medium text-zinc-600">Search bookings</span>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Parent, child, activity, provider, reference…"
            className="mt-1.5 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-500/20"
          />
        </label>
        <p className="mt-2 text-xs text-zinc-400">
          {filtered.length} of {bookings.length} bookings
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-100">
            <thead>
              <tr className="bg-zinc-50/80">
                {[
                  "Reference",
                  "Parent / Child",
                  "Activity",
                  "Provider",
                  "Date",
                  "Status",
                  "Payment",
                  "Amount",
                  "",
                ].map((heading) => (
                  <th
                    key={heading || "actions"}
                    scope="col"
                    className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {pagination.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-sm text-zinc-500"
                  >
                    {bookings.length === 0 ? "No bookings yet." : "No bookings match your search."}
                  </td>
                </tr>
              ) : (
                pagination.items.map((booking) => (
                  <BookingRows
                    key={booking.id}
                    booking={booking}
                    expandedId={expandedId}
                    notes={notes}
                    onToggle={toggleExpand}
                    onNotesChange={(id, value) =>
                      setNotes((current) => ({ ...current, [id]: value }))
                    }
                    onStub={handleStub}
                  />
                ))
              )}
            </tbody>
          </table>
          {pagination.totalItems > 0 ? (
            <PaginationControls
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
              onPageChange={setPage}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BookingRows({
  booking,
  expandedId,
  notes,
  onToggle,
  onNotesChange,
  onStub,
}: {
  booking: AdminBooking;
  expandedId: string | null;
  notes: Record<string, string>;
  onToggle: (booking: AdminBooking) => void;
  onNotesChange: (id: string, value: string) => void;
  onStub: (label: string, booking: AdminBooking) => void;
}) {
  const isExpanded = expandedId === booking.id;

  return (
    <>
      <tr className="hover:bg-zinc-50/50">
        <td className="px-4 py-4 font-mono text-xs text-zinc-700">
          {booking.reference}
        </td>
        <td className="px-4 py-4 text-sm">
          {booking.parentName}
          <span className="block text-xs text-zinc-500">{booking.childName}</span>
        </td>
        <td className="px-4 py-4 text-sm text-zinc-700">{booking.activityTitle}</td>
        <td className="px-4 py-4 text-sm text-zinc-700">{booking.providerName}</td>
        <td className="px-4 py-4 text-sm text-zinc-700">
          {formatSessionDate(booking.sessionDate)}
        </td>
        <td className="px-4 py-4 text-sm capitalize text-zinc-700">
          {booking.status.replace("_", " ")}
        </td>
        <td className="px-4 py-4 text-sm text-zinc-700">
          {BOOKING_PAYMENT_STATUS_LABELS[booking.paymentStatus]}
        </td>
        <td className="px-4 py-4 text-sm font-medium text-zinc-900">
          {formatCurrency(booking.amount)}
        </td>
        <td className="px-4 py-4">
          <button
            type="button"
            onClick={() => onToggle(booking)}
            className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          >
            {isExpanded ? "Close" : "Manage"}
          </button>
        </td>
      </tr>
      {isExpanded ? (
        <tr>
          <td colSpan={9} className="bg-zinc-50/50 px-4 py-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium text-zinc-600">Admin notes</span>
                <textarea
                  value={notes[booking.id] ?? booking.notes}
                  onChange={(e) => onNotesChange(booking.id, e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                />
              </label>
              <div className="flex flex-col justify-end gap-2">
                <p className="text-xs text-zinc-500">
                  Created {formatDate(booking.createdAt)} · {booking.email}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onStub("Save notes", booking)}
                    className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Save notes
                  </button>
                  <button
                    type="button"
                    onClick={() => onStub("Cancel booking", booking)}
                    className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => onStub("Refund assist", booking)}
                    className="rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-medium text-violet-700"
                  >
                    Refund assist
                  </button>
                  <button
                    type="button"
                    onClick={() => onStub("Update payment status", booking)}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700"
                  >
                    Payment status
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
