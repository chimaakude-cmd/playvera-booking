"use client";

import { PageHeader } from "@/components/club/PageHeader";
import {
  adminEnvMissingLabel,
  adminLiveDataLabel,
} from "@/lib/admin/data-source";
import type { AdminReviewRow } from "@/lib/admin/reviews-data";

type Props = {
  reviews: AdminReviewRow[];
  dataSource: "supabase" | "env_missing";
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-zinc-700">
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function AdminReviewsSection({ reviews, dataSource }: Props) {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Reviews"
        description="Verified parent reviews from Supabase."
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

      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-100">
            <thead>
              <tr className="bg-zinc-50/80">
                {[
                  "Provider",
                  "Activity",
                  "Rating",
                  "Title",
                  "Status",
                  "Reviewer",
                  "Submitted",
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
              {reviews.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-zinc-500"
                  >
                    No reviews yet.
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-zinc-50/50">
                    <td className="px-4 py-4 text-sm font-medium text-zinc-900">
                      {review.providerName}
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-700">
                      {review.activityTitle}
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-700">
                      {review.rating}/5
                    </td>
                    <td className="max-w-xs px-4 py-4 text-sm text-zinc-700">
                      <p className="font-medium">{review.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                        {review.body}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={review.status} />
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-600">
                      {review.reviewerEmail}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-zinc-600">
                      {new Date(review.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
