"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardSection } from "@/components/club/dashboard/DashboardCards";
import { getClubProfile } from "@/lib/club-profile";
import { getReviewInsights } from "@/lib/reviews";

export function ReviewInsightsCard() {
  const [insights, setInsights] = useState(() =>
    getReviewInsights(getClubProfile()?.providerId ?? "local-provider"),
  );

  useEffect(() => {
    setInsights(
      getReviewInsights(getClubProfile()?.providerId ?? "local-provider"),
    );
  }, []);

  return (
    <DashboardSection
      title="Review insights"
      description="Verified parent feedback and request performance"
      action={
        <Link
          href="/club/reviews"
          className="text-xs font-semibold text-teal-700 hover:text-teal-800"
        >
          View all
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-100 bg-gradient-to-br from-amber-50 to-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Review score
          </p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">
            {insights.averageRating > 0
              ? insights.averageRating.toFixed(1)
              : "—"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {insights.publishedReviews} published review
            {insights.publishedReviews === 1 ? "" : "s"}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-100 bg-gradient-to-br from-teal-50 to-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            Response rate
          </p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">
            {insights.responseRate}%
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Reviews with a club response
          </p>
        </div>

        <div className="rounded-xl border border-zinc-100 bg-gradient-to-br from-violet-50 to-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
            Review conversion
          </p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">
            {insights.conversionPercent}%
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Requests converted to reviews
          </p>
        </div>
      </div>

      {insights.recentKeywords.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Recent keywords
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {insights.recentKeywords.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </DashboardSection>
  );
}
