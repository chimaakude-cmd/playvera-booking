"use client";

import Link from "next/link";
import { Archive, MoreVertical, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ActivityRow } from "@/lib/club-activities";
import { canHardDeleteSession } from "@/lib/club-activities/session-actions";

type ActivityCardMenuProps = {
  row: ActivityRow;
  onPreview: (row: ActivityRow) => void;
  onShareActivity: (row: ActivityRow) => void;
  onShareClub: () => void;
  onArchive: (row: ActivityRow) => void;
  onDelete: (row: ActivityRow) => void;
  onCreateQr: (row: ActivityRow) => void;
};

const menuItemClass =
  "block w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50";

export function ActivityCardMenu({
  row,
  onPreview,
  onShareActivity,
  onShareClub,
  onArchive,
  onDelete,
  onCreateQr,
}: ActivityCardMenuProps) {
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

  function closeAnd(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50"
        aria-label="More activity actions"
        aria-expanded={open}
      >
        <MoreVertical className="h-4 w-4" aria-hidden="true" />
      </button>

      {open ? (
        <div className="absolute bottom-full right-0 z-30 mb-2 w-48 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
          <Link
            href={`/club/sessions/${row.id}/edit`}
            onClick={() => setOpen(false)}
            className={menuItemClass}
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={() => closeAnd(() => onPreview(row))}
            className={menuItemClass}
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => closeAnd(() => onArchive(row))}
            className={`${menuItemClass} inline-flex items-center gap-2`}
          >
            <Archive className="h-3.5 w-3.5" aria-hidden="true" />
            Archive
          </button>
          <button
            type="button"
            onClick={() => closeAnd(() => onDelete(row))}
            title={
              deletable
                ? "Delete session"
                : "Cannot delete — session has bookings. Archive instead."
            }
            className={`${menuItemClass} inline-flex items-center gap-2 text-rose-600 hover:bg-rose-50`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Delete
          </button>
          <button
            type="button"
            onClick={() => closeAnd(() => onShareActivity(row))}
            className={menuItemClass}
          >
            Share activity
          </button>
          <button
            type="button"
            onClick={() => closeAnd(() => onShareClub())}
            className={menuItemClass}
          >
            Share club profile
          </button>
          <button
            type="button"
            onClick={() => closeAnd(() => onCreateQr(row))}
            className={menuItemClass}
          >
            Create QR code
          </button>
        </div>
      ) : null}
    </div>
  );
}
