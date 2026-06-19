"use client";

import Link from "next/link";
import { Archive, Trash2 } from "lucide-react";
import type { ActivityRow } from "@/lib/club-activities";

type ActivityRowHoverActionsProps = {
  row: ActivityRow;
  onPreview: (row: ActivityRow) => void;
  onDuplicate: (row: ActivityRow) => void;
  onArchive: (row: ActivityRow) => void;
  onDelete: (row: ActivityRow) => void;
};

const shortcutClass =
  "rounded-lg border border-zinc-200 px-2 py-1 text-[10px] font-semibold text-zinc-700 transition-colors hover:bg-zinc-50";

export function ActivityRowHoverActions({
  row,
  onPreview,
  onDuplicate,
  onArchive,
  onDelete,
}: ActivityRowHoverActionsProps) {
  return (
    <div className="hidden items-center gap-1 lg:group-hover:flex">
      <Link
        href={`/club/sessions/${row.id}/edit`}
        onClick={(event) => event.stopPropagation()}
        className={shortcutClass}
      >
        Edit
      </Link>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onDuplicate(row);
        }}
        className={shortcutClass}
      >
        Duplicate
      </button>
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
      <Link
        href={`/book/${row.id}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => event.stopPropagation()}
        className={shortcutClass}
      >
        Example booking
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
        className="inline-flex items-center gap-0.5 rounded-lg border border-rose-200 px-2 py-1 text-[10px] font-semibold text-rose-600 transition-colors hover:bg-rose-50"
        aria-label={`Delete ${row.title}`}
      >
        <Trash2 className="h-3 w-3" aria-hidden="true" />
        Delete
      </button>
    </div>
  );
}
