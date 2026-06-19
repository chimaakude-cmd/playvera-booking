"use client";

import { PaginationControls } from "@/components/ui/PaginationControls";
import type { ActivityRow } from "@/lib/club-activities";
import { ActivityCard } from "./ActivityCard";

type ActivitiesCardsGridProps = {
  rows: ActivityRow[];
  page: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onPageChange: (page: number) => void;
  onVisibilityToggle: (row: ActivityRow) => void;
  onPreview: (row: ActivityRow) => void;
  onShareActivity: (row: ActivityRow) => void;
  onShareClub: () => void;
  onArchive: (row: ActivityRow) => void;
  onDelete: (row: ActivityRow) => void;
  onToast: (message: string) => void;
};

export function ActivitiesCardsGrid({
  rows,
  page,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  selectedIds,
  onSelectionChange,
  onPageChange,
  onVisibilityToggle,
  onPreview,
  onShareActivity,
  onShareClub,
  onArchive,
  onDelete,
  onToast,
}: ActivitiesCardsGridProps) {
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
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-50/50 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 bg-white px-4 py-3">
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            aria-label="Select all activities on this page"
            className="h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
          />
          Select all on this page
        </label>
        {selectedIds.length > 0 ? (
          <span className="text-xs font-semibold text-teal-700">
            {selectedIds.length} selected
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <ActivityCard
            key={row.id}
            row={row}
            selected={selectedIds.includes(row.id)}
            onSelectToggle={() => toggleRow(row.id)}
            onVisibilityToggle={onVisibilityToggle}
            onPreview={onPreview}
            onShareActivity={onShareActivity}
            onShareClub={onShareClub}
            onArchive={onArchive}
            onDelete={onDelete}
            onToast={onToast}
          />
        ))}
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
