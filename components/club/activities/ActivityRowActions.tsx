"use client";

import Link from "next/link";
import { Archive, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ActivityRow } from "@/lib/club-activities";
import { canHardDeleteSession } from "@/lib/club-activities/session-actions";

type ActivityRowActionsProps = {
  row: ActivityRow;
  onDuplicate: (row: ActivityRow) => void;
  onArchive: (row: ActivityRow) => void;
  onDelete: (row: ActivityRow) => void;
};

export function ActivityRowActions({
  row,
  onDuplicate,
  onArchive,
  onDelete,
}: ActivityRowActionsProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const deletable = canHardDeleteSession(row);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="flex items-center gap-1" ref={menuRef}>
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
        className={`rounded-lg border p-1.5 transition-colors ${
          deletable
            ? "border-zinc-200 text-zinc-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            : "border-zinc-200 text-zinc-400 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
        }`}
        aria-label={`Delete ${row.title}`}
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setOpen((current) => !current);
          }}
          className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
          aria-label="Activity actions"
        >
          ···
        </button>

        {open ? (
          <div className="absolute right-0 z-30 mt-1 w-44 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
            <Link
              href={`/club/sessions/${row.id}/edit`}
              onClick={(event) => event.stopPropagation()}
              className="block px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setOpen(false);
                onDuplicate(row);
              }}
              className="block w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
            >
              Duplicate
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setOpen(false);
                onArchive(row);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
            >
              <Archive className="h-3.5 w-3.5" aria-hidden="true" />
              Archive
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setOpen(false);
                onDelete(row);
              }}
              className="block w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
            >
              Delete
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
