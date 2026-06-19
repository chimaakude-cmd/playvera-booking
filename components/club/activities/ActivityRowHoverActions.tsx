"use client";

import Link from "next/link";
import { Archive, Trash2 } from "lucide-react";
import type { ActivityRow } from "@/lib/club-activities";
import { canHardDeleteSession } from "@/lib/club-activities/session-actions";

type ActivityRowHoverActionsProps = {
  row: ActivityRow;
  onPreview: (row: ActivityRow) => void;
  onArchive: (row: ActivityRow) => void;
  onDelete: (row: ActivityRow) => void;
};

const shortcutClass =
  "rounded-lg border border-zinc-200 px-2 py-1 text-[10px] font-semibold text-zinc-700 transition-colors hover:bg-zinc-50";

export function ActivityRowHoverActions({
  row,
  onPreview,
  onArchive,
  onDelete,
}: ActivityRowHoverActionsProps) {
  const deletable = canHardDeleteSession(row);

  return (
    <div className="hidden items-center gap-1 lg:group-hover:flex">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onPreview(row);
        }}
        className={shortcutClass}
      >
        Preview
      </button>
      <Link
        href={`/club/registers?session=${row.id}`}
        onClick={(event) => event.stopPropagation()}
        className="rounded-lg bg-teal-600 px-2 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-teal-700"
      >
        Register
      </Link>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onArchive(row);
        }}
        className={`${shortcutClass} inline-flex items-center gap-0.5`}
      >
        <Archive className="h-3 w-3" aria-hidden="true" />
        Archive
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onDelete(row);
        }}
        title={
          deletable
            ? "Delete session"
            : "Cannot delete — session has bookings. Archive instead."
        }
        className="inline-flex items-center gap-0.5 rounded-lg border border-rose-200 px-2 py-1 text-[10px] font-semibold text-rose-600 transition-colors hover:bg-rose-50"
        aria-label={`Delete ${row.title}`}
      >
        <Trash2 className="h-3 w-3" aria-hidden="true" />
        Delete
      </button>
    </div>
  );
}
