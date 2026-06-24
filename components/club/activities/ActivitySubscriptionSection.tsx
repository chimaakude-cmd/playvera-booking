"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/payments";
import type { ParentSubscriptionRecord } from "@/lib/session-subscriptions/types";

type ActivitySubscriptionSectionProps = {
  sessionId: string;
};

export function ActivitySubscriptionSection({
  sessionId,
}: ActivitySubscriptionSectionProps) {
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    activeSubscribers: number;
    trialingSubscribers: number;
    failedPayments: number;
    estimatedMrr: number;
    records: ParentSubscriptionRecord[];
  } | null>(null);
  const [error, setError] = useState("");

  async function loadStats() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/club/sessions/${encodeURIComponent(sessionId)}/subscriptions`,
        { credentials: "include" },
      );
      const data = (await response.json()) as typeof stats & { error?: string };
      if (!response.ok) {
        throw new Error(data?.error ?? "Could not load subscriptions.");
      }
      setStats(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load subscriptions.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStats();
  }, [sessionId]);

  async function handleCancel(recordId: string) {
    if (
      !window.confirm(
        "Cancel this parent subscription? They will stop being billed at the end of the current period unless Stripe cancels immediately.",
      )
    ) {
      return;
    }

    setCancelingId(recordId);
    try {
      const response = await fetch(
        `/api/club/sessions/${encodeURIComponent(sessionId)}/subscriptions`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "cancel", recordId }),
        },
      );
      const data = (await response.json()) as typeof stats & { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not cancel subscription.");
      }
      setStats(data);
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : "Could not cancel subscription.",
      );
    } finally {
      setCancelingId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading subscription data…</p>;
  }

  if (error && !stats) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!stats) {
    return null;
  }

  const hasRecords = stats.records.length > 0;

  return (
    <div className="space-y-4">
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-zinc-50 px-4 py-3">
          <dt className="text-xs text-zinc-500">Active subscribers</dt>
          <dd className="mt-1 text-lg font-semibold text-zinc-900">
            {stats.activeSubscribers + stats.trialingSubscribers}
          </dd>
        </div>
        <div className="rounded-xl bg-zinc-50 px-4 py-3">
          <dt className="text-xs text-zinc-500">Estimated MRR</dt>
          <dd className="mt-1 text-lg font-semibold text-zinc-900">
            {formatMoney(stats.estimatedMrr)}
          </dd>
        </div>
        <div className="rounded-xl bg-zinc-50 px-4 py-3">
          <dt className="text-xs text-zinc-500">Failed payments</dt>
          <dd className="mt-1 text-lg font-semibold text-zinc-900">
            {stats.failedPayments}
          </dd>
        </div>
      </dl>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {hasRecords ? (
        <div className="overflow-hidden rounded-xl border border-zinc-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Parent</th>
                <th className="px-3 py-2 font-semibold">Child</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Amount</th>
                <th className="px-3 py-2 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {stats.records.map((record) => (
                <tr key={record.id} className="border-t border-zinc-100">
                  <td className="px-3 py-2">
                    <p className="font-medium text-zinc-900">{record.parentName}</p>
                    <p className="text-xs text-zinc-500">{record.parentEmail}</p>
                  </td>
                  <td className="px-3 py-2 text-zinc-700">{record.childName}</td>
                  <td className="px-3 py-2 capitalize text-zinc-700">
                    {record.status.replace("_", " ")}
                  </td>
                  <td className="px-3 py-2 text-zinc-700">
                    {formatMoney(record.monthlyAmount)}/mo
                  </td>
                  <td className="px-3 py-2 text-right">
                    {record.status === "active" || record.status === "trialing" ? (
                      <button
                        type="button"
                        disabled={cancelingId === record.id}
                        onClick={() => void handleCancel(record.id)}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">
          No parent subscriptions yet. When parents subscribe, they will appear here.
        </p>
      )}
    </div>
  );
}
