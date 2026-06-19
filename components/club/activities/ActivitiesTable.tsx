"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import { PaginationControls } from "@/components/ui/PaginationControls";
import {
  ACTIVITY_STATUS_LABELS,
  type ActivityRow,
} from "@/lib/club-activities";
import { imageStorage } from "@/lib/image-storage";
import { ActivityRowActions } from "./ActivityRowActions";
import { ActivityRowHoverActions } from "./ActivityRowHoverActions";

const STATUS_STYLES = {
  published: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  draft: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
  archived: "bg-amber-50 text-amber-800 ring-amber-200",
  full: "bg-violet-50 text-violet-700 ring-violet-200",
} as const;

function formatDateLabel(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getOccupancyTone(percent: number): "green" | "amber" | "red" {
  if (percent >= 80) return "green";
  if (percent >= 50) return "amber";
  return "red";
}

function WarningBadges({ row }: { row: ActivityRow }) {
  if (row.warnings.length === 0) return null;

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {row.warnings.includes("low_bookings") ? (
        <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
          ⚠ Low bookings
        </span>
      ) : null}
      {row.warnings.includes("nearly_full") ? (
        <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-orange-800">
          🔥 Nearly full
        </span>
      ) : null}
      {row.warnings.includes("trending") ? (
        <span className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-semibold text-teal-800">
          ⭐ Trending
        </span>
      ) : null}
    </div>
  );
}

function StarRating({
  rating,
  count,
}: {
  rating: number;
  count: number;
}) {
  if (count === 0) {
    return <span className="text-xs text-zinc-400">No reviews yet</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-sm font-semibold text-zinc-900">
        {rating.toFixed(1)}
      </span>
      <span className="text-amber-500">★</span>
      <span className="text-xs text-zinc-500">({count})</span>
    </div>
  );
}

function OccupancyBar({ row }: { row: ActivityRow }) {
  const tone = getOccupancyTone(row.occupancy.percent);
  const dotClass =
    tone === "green"
      ? "bg-emerald-500"
      : tone === "amber"
        ? "bg-amber-500"
        : "bg-rose-500";

  return (
    <div className="min-w-[120px]">
      <div className="flex items-center gap-1.5 text-xs">
        <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
        <span className="font-medium text-zinc-800">
          {row.occupancy.filled} / {row.occupancy.capacity} ({row.occupancy.percent}%)
        </span>
      </div>
    </div>
  );
}

type ActivitiesTableProps = {
  rows: ActivityRow[];
  page: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onPageChange: (page: number) => void;
  onRowClick: (row: ActivityRow) => void;
  onVisibilityToggle: (row: ActivityRow) => void;
  onPreview: (row: ActivityRow) => void;
  onShare: (row: ActivityRow) => void;
  onArchive: (row: ActivityRow) => void;
  onDelete: (row: ActivityRow) => void;
};

export function ActivitiesTable({
  rows,
  page,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  selectedIds,
  onSelectionChange,
  onPageChange,
  onRowClick,
  onVisibilityToggle,
  onPreview,
  onShare,
  onArchive,
  onDelete,
}: ActivitiesTableProps) {
  const allSelected =
    rows.length > 0 && rows.every((row) => selectedIds.includes(row.id));

  function toggleRow(id: string) {
    onSelectionChange(
      selectedIds.includes(id)
        ? selectedIds.filter((selectedId) => selectedId !== id)
        : [...selectedIds, id],
    );
  }

  function toggleAll() {
    if (allSelected) {
      onSelectionChange(
        selectedIds.filter((id) => !rows.some((row) => row.id === id)),
      );
      return;
    }

    const next = new Set(selectedIds);
    for (const row of rows) {
      next.add(row.id);
    }
    onSelectionChange(Array.from(next));
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full divide-y divide-zinc-100">
          <thead>
            <tr className="bg-zinc-50/80">
              <th scope="col" className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all activities on this page"
                  className="h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
                />
              </th>
              {[
                "Activity",
                "Dates",
                "Occupancy",
                "Time",
                "Reviews",
                "Venue",
                "Status",
                "Visibility",
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
            {rows.map((row) => {
              const imageUrl = imageStorage.getPreviewUrl(row.imageId);

              return (
                <tr
                  key={row.id}
                  onClick={() => onRowClick(row)}
                  className="group relative cursor-pointer hover:bg-zinc-50/60"
                >
                  <td
                    className="px-3 py-4"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => toggleRow(row.id)}
                      aria-label={`Select ${row.title}`}
                      className="h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                        <SafeImage
                          src={imageUrl}
                          alt={row.title}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-900">
                          {row.title}
                        </p>
                        <p className="text-xs text-zinc-500">{row.ageRange}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {row.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <WarningBadges row={row} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-zinc-700">
                    <p>
                      {formatDateLabel(row.startDate)} →{" "}
                      {formatDateLabel(row.endDate)}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {row.daysOfWeek.map((day) => (
                        <span
                          key={day}
                          className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600"
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <OccupancyBar row={row} />
                  </td>
                  <td className="px-4 py-4 text-sm text-zinc-700">
                    {row.timeRange}
                  </td>
                  <td className="px-4 py-4">
                    <StarRating
                      rating={row.reviews.rating}
                      count={row.reviews.count}
                    />
                  </td>
                  <td className="max-w-[140px] truncate px-4 py-4 text-sm text-zinc-700">
                    {row.venueName}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[row.status]}`}
                    >
                      {ACTIVITY_STATUS_LABELS[row.status]}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onVisibilityToggle(row);
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        row.visibility ? "bg-emerald-500" : "bg-zinc-300"
                      }`}
                      aria-label={`Toggle visibility for ${row.title}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          row.visibility ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </td>
                  <td
                    className="relative whitespace-nowrap px-4 py-4"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <ActivityRowHoverActions
                        row={row}
                        onPreview={onPreview}
                        onArchive={onArchive}
                        onDelete={onDelete}
                      />
                      <ActivityRowActions
                        row={row}
                        onPreview={onPreview}
                        onShare={onShare}
                        onArchive={onArchive}
                        onDelete={onDelete}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-zinc-100 lg:hidden">
        {rows.map((row) => {
          const imageUrl = imageStorage.getPreviewUrl(row.imageId);

          return (
            <article
              key={row.id}
              onClick={() => onRowClick(row)}
              className="cursor-pointer p-4"
            >
              <div className="flex gap-3">
                <div
                  className="pt-1"
                  onClick={(event) => event.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(row.id)}
                    onChange={() => toggleRow(row.id)}
                    aria-label={`Select ${row.title}`}
                    className="h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
                  />
                </div>
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-zinc-200">
                  <SafeImage
                    src={imageUrl}
                    alt={row.title}
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900">
                        {row.title}
                      </h3>
                      <p className="text-xs text-zinc-500">{row.venueName}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${STATUS_STYLES[row.status]}`}
                    >
                      {ACTIVITY_STATUS_LABELS[row.status]}
                    </span>
                  </div>
                  <div className="mt-2">
                    <OccupancyBar row={row} />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <StarRating
                      rating={row.reviews.rating}
                      count={row.reviews.count}
                    />
                    <div onClick={(event) => event.stopPropagation()}>
                      <ActivityRowActions
                        row={row}
                        onPreview={onPreview}
                        onShare={onShare}
                        onArchive={onArchive}
                        onDelete={onDelete}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <PaginationControls
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        startIndex={startIndex}
        endIndex={endIndex}
        onPageChange={onPageChange}
      />
    </div>
  );
}
