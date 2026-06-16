"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ActivityRow } from "@/lib/club-activities";

type ActivityRowActionsProps = {
  row: ActivityRow;
  onPreview: (row: ActivityRow) => void;
  onShare: (row: ActivityRow) => void;
  onDuplicate: (row: ActivityRow) => void;
  onDelete: (row: ActivityRow) => void;
};

export function ActivityRowActions({
  row,
  onPreview,
  onShare,
  onDuplicate,
  onDelete,
}: ActivityRowActionsProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    <div className="relative" ref={menuRef}>
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
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setOpen(false);
              onPreview(row);
            }}
            className="block w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Preview
          </button>
          <Link
            href={`/club/sessions/${row.id}/edit`}
            onClick={(event) => event.stopPropagation()}
            className="block px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Edit
          </Link>
          <Link
            href={`/club/registers?session=${row.id}`}
            onClick={(event) => event.stopPropagation()}
            className="block px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Register
          </Link>
          <Link
            href={`/club/communications?activity=${row.id}`}
            onClick={(event) => event.stopPropagation()}
            className="block px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Communications
          </Link>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setOpen(false);
              onShare(row);
            }}
            className="block w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Share
          </button>
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
              onDelete(row);
            }}
            className="block w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}
