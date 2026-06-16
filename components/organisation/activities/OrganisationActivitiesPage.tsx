"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/club/EmptyState";
import { LoadingState } from "@/components/club/LoadingState";
import { PageHeader } from "@/components/club/PageHeader";
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
import { SafeImage } from "@/components/ui/SafeImage";
import {
  DEFAULT_ORG_ACTIVITY_FILTERS,
  filterOrgActivities,
  formatOrgCurrency,
  formatOrgDate,
  getOrgActivities,
  getOrgActivityFilterOptions,
  ORG_ACTIVITY_TYPE_LABELS,
  type OrgActivity,
  type OrgActivityFilters,
} from "@/lib/organisation";
import { paginateItems } from "@/lib/pagination";

function activityStatusTone(
  status: OrgActivity["status"],
): "emerald" | "amber" | "zinc" {
  if (status === "published") return "emerald";
  if (status === "draft") return "amber";
  return "zinc";
}

export function OrganisationActivitiesPage() {
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<OrgActivityFilters>(
    DEFAULT_ORG_ACTIVITY_FILTERS,
  );
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [activities, setActivities] = useState<OrgActivity[]>([]);

  const filterOptions = useMemo(
    () => getOrgActivityFilterOptions(activities),
    [activities],
  );

  const filtered = useMemo(
    () => filterOrgActivities(activities, filters),
    [activities, filters],
  );

  const pagination = useMemo(
    () => paginateItems(filtered, page, 8),
    [filtered, page],
  );

  useEffect(() => {
    setActivities(getOrgActivities());
    setLoading(false);
  }, []);

  function updateFilter<K extends keyof OrgActivityFilters>(
    key: K,
    value: OrgActivityFilters[K],
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  function stubAction(label: string) {
    setMessage(`${label} (demo action).`);
  }

  if (loading) {
    return <LoadingState message="Loading network activities..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activities"
        description="Search and monitor activities across all franchisee clubs in your network."
      />

      <OrgToast message={message} />

      <OrgFilterPanel>
        <OrgFilterField label="Search" className="sm:col-span-2 lg:col-span-2">
          <input
            type="search"
            value={filters.query}
            onChange={(e) => updateFilter("query", e.target.value)}
            placeholder="Activity, club, or venue"
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
        <OrgFilterField label="Type">
          <select
            value={filters.type}
            onChange={(e) =>
              updateFilter(
                "type",
                e.target.value as OrgActivityFilters["type"],
              )
            }
            className={orgSelectClass}
          >
            <option value="all">All types</option>
            {Object.entries(ORG_ACTIVITY_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </OrgFilterField>
        <OrgFilterField label="Venue">
          <select
            value={filters.venue}
            onChange={(e) => updateFilter("venue", e.target.value)}
            className={orgSelectClass}
          >
            <option value="all">All venues</option>
            {filterOptions.venues.map((venue) => (
              <option key={venue} value={venue}>
                {venue}
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
                e.target.value as OrgActivityFilters["status"],
              )
            }
            className={orgSelectClass}
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </OrgFilterField>
        <OrgFilterField label="From date">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => updateFilter("dateFrom", e.target.value)}
            className={orgInputClass}
          />
        </OrgFilterField>
        <OrgFilterField label="To date">
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => updateFilter("dateTo", e.target.value)}
            className={orgInputClass}
          />
        </OrgFilterField>
      </OrgFilterPanel>

      {activities.length === 0 ? (
        <EmptyState
          title="No activities in network"
          description="Franchisee clubs haven't published any activities yet."
          actionLabel="Manage franchisees"
          actionHref="/organisation/clubs"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matching activities"
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
              "Activity",
              "Franchisee club",
              "Venue",
              "Dates",
              "Time",
              "Booked / capacity",
              "Revenue",
              "Status",
              "Actions",
            ]}
          >
            {pagination.items.map((activity) => (
              <tr key={activity.id} className="hover:bg-zinc-50/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {activity.imageUrl ? (
                      <SafeImage
                        src={activity.imageUrl}
                        alt=""
                        width={40}
                        height={40}
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-xs font-semibold text-violet-700">
                        {activity.title.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-zinc-900">{activity.title}</p>
                      <p className="text-xs text-zinc-500">
                        {ORG_ACTIVITY_TYPE_LABELS[activity.type]}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {activity.franchiseeClubName}
                </td>
                <td className="px-4 py-3 text-zinc-600">{activity.venue}</td>
                <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                  {formatOrgDate(activity.startDate)} –{" "}
                  {formatOrgDate(activity.endDate)}
                </td>
                <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                  {activity.timeLabel}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {activity.booked} / {activity.capacity}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {formatOrgCurrency(activity.revenuePence)}
                </td>
                <td className="px-4 py-3">
                  <OrgStatusBadge
                    label={activity.status}
                    tone={activityStatusTone(activity.status)}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex min-w-[220px] flex-wrap gap-x-2 gap-y-1">
                    <OrgActionLink onClick={() => stubAction("View activity")}>
                      View
                    </OrgActionLink>
                    {activity.canEdit ? (
                      <OrgActionLink onClick={() => stubAction("Edit activity")}>
                        Edit
                      </OrgActionLink>
                    ) : null}
                    <Link
                      href={`/club/registers?session=${activity.id}`}
                      className="text-xs font-semibold text-violet-700 hover:text-violet-900"
                    >
                      Open register
                    </Link>
                    <OrgActionLink onClick={() => stubAction("View bookings")}>
                      View bookings
                    </OrgActionLink>
                    <Link
                      href="/club/dashboard"
                      className="text-xs font-semibold text-violet-700 hover:text-violet-900"
                    >
                      View club dashboard
                    </Link>
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
