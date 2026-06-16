"use client";

import { useEffect, useRef, useState } from "react";
import type { SupportThread } from "@/lib/support";

type SupportThreadMenuProps = {
  thread: SupportThread;
  onRename: (threadId: string, subject: string) => void;
  onArchive: (threadId: string) => void;
  onDelete: (threadId: string) => void;
  onUnarchive?: (threadId: string) => void;
  onRestore?: (threadId: string) => void;
  onPermanentDelete?: (threadId: string) => void;
  variant?: "active" | "archived" | "deleted";
};

export function SupportThreadMenu({
  thread,
  onRename,
  onArchive,
  onDelete,
  onUnarchive,
  onRestore,
  onPermanentDelete,
  variant = "active",
}: SupportThreadMenuProps) {
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(thread.subject);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleRenameSubmit(event: React.FormEvent) {
    event.preventDefault();
    onRename(thread.id, name);
    setRenaming(false);
    setOpen(false);
  }

  if (renaming) {
    return (
      <form onSubmit={handleRenameSubmit} className="flex items-center gap-1">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-w-0 flex-1 rounded border border-zinc-200 px-2 py-1 text-[10px]"
          autoFocus
        />
        <button
          type="submit"
          className="rounded bg-teal-600 px-2 py-1 text-[10px] font-semibold text-white"
        >
          Save
        </button>
      </form>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        aria-label="Conversation options"
      >
        ⋮
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
          {variant === "active" ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setRenaming(true);
                  setOpen(false);
                }}
                className="block w-full px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-50"
              >
                Rename
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive(thread.id);
                  setOpen(false);
                }}
                className="block w-full px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-50"
              >
                Archive
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(thread.id);
                  setOpen(false);
                }}
                className="block w-full px-3 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50"
              >
                Delete
              </button>
            </>
          ) : null}
          {variant === "archived" && onUnarchive ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUnarchive(thread.id);
                  setOpen(false);
                }}
                className="block w-full px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-50"
              >
                Unarchive
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(thread.id);
                  setOpen(false);
                }}
                className="block w-full px-3 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50"
              >
                Delete
              </button>
            </>
          ) : null}
          {variant === "deleted" ? (
            <>
              {onRestore ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore(thread.id);
                    setOpen(false);
                  }}
                  className="block w-full px-3 py-1.5 text-left text-xs text-teal-700 hover:bg-teal-50"
                >
                  Restore
                </button>
              ) : null}
              {onPermanentDelete ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPermanentDelete(thread.id);
                    setOpen(false);
                  }}
                  className="block w-full px-3 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50"
                >
                  Delete permanently
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
