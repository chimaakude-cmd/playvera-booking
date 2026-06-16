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
  DEFAULT_ORG_REVIEW_FILTERS,
  filterOrgReviews,
  formatOrgDate,
  getOrgReviewFilterOptions,
  getOrgReviewMetrics,
  getOrgReviews,
  updateOrgReviewStatus,
  type OrgReviewFilters,
  type OrgReview,
} from "@/lib/organisation";
import { paginateItems } from "@/lib/pagination";

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
      {rating}
      <span className="text-amber-400">★</span>
    </span>
  );
}

export function OrganisationReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<OrgReviewFilters>(
    DEFAULT_ORG_REVIEW_FILTERS,
  );
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [reviews, setReviews] = useState<OrgReview[]>([]);

  const metrics = useMemo(() => getOrgReviewMetrics(reviews), [reviews]);
  const filterOptions = useMemo(
    () => getOrgReviewFilterOptions(reviews),
    [reviews],
  );

  const filtered = useMemo(
    () => filterOrgReviews(reviews, filters),
    [reviews, filters],
  );

  const pagination = useMemo(
    () => paginateItems(filtered, page, 8),
    [filtered, page],
  );

  useEffect(() => {
    setReviews(getOrgReviews());
    setLoading(false);
  }, [refreshKey]);

  function updateFilter<K extends keyof OrgReviewFilters>(
    key: K,
    value: OrgReviewFilters[K],
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  function stubAction(label: string) {
    setMessage(`${label} (demo action).`);
  }

  function handleHide(reviewId: string) {
    updateOrgReviewStatus(reviewId, "hidden");
    setMessage("Review hidden.");
    setRefreshKey((k) => k + 1);
  }

  function handleFlag(reviewId: string) {
    updateOrgReviewStatus(reviewId, "reported", true);
    setMessage("Review flagged for review.");
    setRefreshKey((k) => k + 1);
  }

  if (loading) {
    return <LoadingState message="Loading network reviews..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        description="Verified parent reviews across all franchisee clubs."
        action={
          <OrgActionLink onClick={() => stubAction("Export reviews CSV")}>
            Export all
          </OrgActionLink>
        }
      />

      <OrgToast message={message} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label="Average rating"
          value={
            metrics.avgRating > 0 ? metrics.avgRating.toFixed(1) : "—"
          }
          hint="Published reviews"
          accent="amber"
        />
        <DashboardStatCard
          label="Total reviews"
          value={String(metrics.total)}
          hint="All statuses"
          accent="violet"
        />
        <DashboardStatCard
          label="This month"
          value={String(metrics.thisMonth)}
          hint="Submitted in June"
          accent="teal"
        />
        <DashboardStatCard
          label="Flagged"
          value={String(metrics.flagged)}
          hint="Needs attention"
          accent="rose"
        />
      </div>

      <OrgFilterPanel>
        <OrgFilterField label="Search" className="sm:col-span-2">
          <input
            type="search"
            value={filters.query}
            onChange={(e) => updateFilter("query", e.target.value)}
            placeholder="Review text, session, or club"
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
        <OrgFilterField label="Status">
          <select
            value={filters.status}
            onChange={(e) =>
              updateFilter(
                "status",
                e.target.value as OrgReviewFilters["status"],
              )
            }
            className={orgSelectClass}
          >
            <option value="all">All</option>
            <option value="published">Published</option>
            <option value="pending_verification">Pending verification</option>
            <option value="rejected">Rejected</option>
            <option value="reported">Reported</option>
            <option value="hidden">Hidden</option>
          </select>
        </OrgFilterField>
        <OrgFilterField label="Flagged only">
          <select
            value={filters.flaggedOnly ? "yes" : "no"}
            onChange={(e) => updateFilter("flaggedOnly", e.target.value === "yes")}
            className={orgSelectClass}
          >
            <option value="no">Show all</option>
            <option value="yes">Flagged only</option>
          </select>
        </OrgFilterField>
      </OrgFilterPanel>

      {reviews.length === 0 ? (
        <EmptyState
          title="No reviews submitted yet."
          description="Reviews from franchisee club sessions will appear here."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matching reviews"
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
              "Rating",
              "Review",
              "Session attended",
              "Franchisee club",
              "Date reviewed",
              "Status",
              "Actions",
            ]}
          >
            {pagination.items.map((review) => (
              <tr key={review.id} className="hover:bg-zinc-50/50">
                <td className="px-4 py-3">
                  <StarRating rating={review.rating} />
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <p className="line-clamp-2 text-zinc-700">{review.body}</p>
                  <p className="mt-1 text-xs text-zinc-500">{review.parentName}</p>
                </td>
                <td className="px-4 py-3 text-zinc-600">{review.sessionTitle}</td>
                <td className="px-4 py-3 text-zinc-600">
                  {review.franchiseeClubName}
                </td>
                <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                  {formatOrgDate(review.reviewedAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <OrgStatusBadge
                      label={review.status}
                      tone={
                        review.status === "published"
                          ? "emerald"
                          : review.status === "reported"
                            ? "rose"
                            : review.status === "pending_verification"
                              ? "amber"
                              : review.status === "rejected"
                                ? "rose"
                              : "zinc"
                      }
                    />
                    {review.flagged ? (
                      <span className="text-[10px] font-semibold uppercase text-rose-600">
                        Flagged
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex min-w-[200px] flex-wrap gap-x-2 gap-y-1">
                    <OrgActionLink onClick={() => stubAction("View review")}>
                      View
                    </OrgActionLink>
                    <OrgActionLink onClick={() => stubAction("Respond to review")}>
                      Respond
                    </OrgActionLink>
                    <OrgActionLink onClick={() => handleHide(review.id)}>
                      Hide
                    </OrgActionLink>
                    <OrgActionLink
                      variant="danger"
                      onClick={() => handleFlag(review.id)}
                    >
                      Flag
                    </OrgActionLink>
                    <OrgActionLink onClick={() => stubAction("Export review")}>
                      Export
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
