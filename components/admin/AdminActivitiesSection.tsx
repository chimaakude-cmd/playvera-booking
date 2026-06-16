"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/club/PageHeader";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { adminEnvMissingLabel } from "@/lib/admin/data-source";
import { ACTIVITY_STATUS_LABELS, type AdminActivity } from "@/lib/admin";
import { paginateItems } from "@/lib/pagination";

type Props = {
  activities: AdminActivity[];
  dataSource: "supabase" | "env_missing";
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function StatusBadge({ status }: { status: AdminActivity["status"] }) {
  const styles: Record<AdminActivity["status"], string> = {
    published: "bg-emerald-50 text-emerald-700",
    paused: "bg-amber-50 text-amber-800",
    cancelled: "bg-rose-50 text-rose-700",
    draft: "bg-zinc-100 text-zinc-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {ACTIVITY_STATUS_LABELS[status]}
    </span>
  );
}

export function AdminActivitiesSection({ activities, dataSource }: Props) {
  const [page, setPage] = useState(1);
  const pagination = useMemo(
    () => paginateItems(activities, page, 10),
    [activities, page],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Activities"
        description="All sessions and activities across providers on the Activora marketplace."
        action={
          dataSource === "env_missing" ? (
            <span className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800">
              {adminEnvMissingLabel()}
            </span>
          ) : undefined
        }
      />

      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-100">
            <thead>
              <tr className="bg-zinc-50/80">
                {[
                  "Activity",
                  "Provider",
                  "Schedule",
                  "Venue",
                  "Capacity",
                  "Price",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
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
                    colSpan={8}
                    className="px-4 py-12 text-center text-sm text-zinc-500"
                  >
                    No activities created yet.
                  </td>
                </tr>
              ) : (
                pagination.items.map((activity) => (
                  <tr key={activity.id} className="hover:bg-zinc-50/50">
                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/activities/${activity.id}`}
                        className="text-sm font-medium text-violet-700 hover:text-violet-900"
                      >
                        {activity.title}
                      </Link>
                      <p className="text-xs text-zinc-500">
                        {activity.visibility === "public" ? "Public" : "Hidden"}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-700">
                      {activity.providerName}
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-700">
                      {activity.day}
                      <span className="block text-xs text-zinc-500">
                        {activity.startTime}–{activity.endTime}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-700">
                      {activity.venue}
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-700">
                      {activity.bookingsCount}/{activity.capacity}
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-700">
                      {activity.price === 0
                        ? "Free"
                        : formatCurrency(activity.price)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={activity.status} />
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/activities/${activity.id}`}
                        className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
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
