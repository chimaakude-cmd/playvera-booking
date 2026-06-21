"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { PaymentEventFilter, PaymentEventRow } from "@/lib/payments/payment-events-data";
import { formatMoney } from "@/lib/payments";

const FILTER_OPTIONS: Array<{ id: PaymentEventFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "success", label: "Success" },
  { id: "pending", label: "Pending" },
  { id: "failed", label: "Failed" },
];

const STATUS_LABELS: Record<PaymentEventRow["status"], string> = {
  success: "Success",
  pending: "Pending",
  failed: "Failed",
};

const STATUS_STYLES: Record<PaymentEventRow["status"], string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  failed: "bg-rose-50 text-rose-700 ring-rose-200",
};

type Props = {
  embedded?: boolean;
};

export function AdminPaymentEventLogSection({ embedded = false }: Props) {
  const [filter, setFilter] = useState<PaymentEventFilter>("all");
  const [events, setEvents] = useState<PaymentEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/payment-events?filter=${encodeURIComponent(filter)}&limit=200`,
      );
      if (!response.ok) {
        throw new Error("Could not load payment events.");
      }

      const body = (await response.json()) as { events: PaymentEventRow[] };
      setEvents(body.events);
    } catch (loadError) {
      setEvents([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load payment events.",
      );
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Payment event log</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Real GoCardless payment records from the database.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              className={
                filter === option.id
                  ? "rounded-lg bg-violet-700 px-3 py-1.5 text-xs font-semibold text-white"
                  : "rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
              }
            >
              {option.label}
            </button>
          ))}
          {!embedded ? (
            <Link
              href="/admin/finance"
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Back to finance
            </Link>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-100">
          <thead>
            <tr className="bg-zinc-50/80">
              {[
                "Date",
                "Provider",
                "Club",
                "Amount",
                "Platform fee",
                "Club payout",
                "Status",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-zinc-500">
                  Loading payment events…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-rose-600">
                  {error}
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-zinc-500">
                  No payment events recorded yet.
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id} className="hover:bg-zinc-50/50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-700">
                    {new Intl.DateTimeFormat("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(event.date))}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-700">{event.provider}</td>
                  <td className="px-6 py-4 text-sm font-medium text-zinc-900">
                    {event.providerName}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-700">
                    {formatMoney(event.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-700">
                    {formatMoney(event.platformFee)}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-700">
                    {formatMoney(event.clubPayout)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[event.status]}`}
                    >
                      {STATUS_LABELS[event.status]}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}
