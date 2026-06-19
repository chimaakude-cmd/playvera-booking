"use client";

import Link from "next/link";
import { Archive, Share2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ActivityRow } from "@/lib/club-activities";
import { canHardDeleteSession } from "@/lib/club-activities/session-actions";

type ActivityRowActionsProps = {
  row: ActivityRow;
  onPreview: (row: ActivityRow) => void;
  onShare: (row: ActivityRow) => void;
  onArchive: (row: ActivityRow) => void;
  onDelete: (row: ActivityRow) => void;
};

const mobileButtonClass =
  "rounded-lg border border-zinc-200 px-2 py-1 text-[10px] font-semibold text-zinc-700 transition-colors hover:bg-zinc-50";

export function ActivityRowActions({
  row,
  onPreview,
  onShare,
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
      <div className="flex items-center gap-1 lg:hidden">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onPreview(row);
          }}
          className={mobileButtonClass}
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
          className={`${mobileButtonClass} inline-flex items-center gap-0.5`}
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

      <div className="relative">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setOpen((current) => !current);
          }}
          className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
          aria-label="More activity actions"
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
                onShare(row);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
            >
              <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
              Share activity
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
