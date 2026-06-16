"use client";

import { useState } from "react";
import {
  getArchivedThreads,
  getRecentlyDeletedThreads,
  searchThreads,
} from "@/lib/support/storage";
import type { SupportThread } from "@/lib/support";
import { useSupport } from "./SupportProvider";
import { SupportBulkActions } from "./SupportBulkActions";
import { SupportDeleteModal } from "./SupportDeleteModal";
import { SupportThreadMenu } from "./SupportThreadMenu";

function formatThreadTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function ThreadRow({
  thread,
  activeThreadId,
  selectMode,
  selected,
  onSelect,
  onOpen,
  variant = "active",
}: {
  thread: SupportThread;
  activeThreadId: string | null;
  selectMode: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  variant?: "active" | "archived" | "deleted";
}) {
  const {
    renameThread,
    archiveThread,
    deleteThread,
    unarchiveThread,
    restoreThread,
    permanentlyDeleteThread,
    refresh,
  } = useSupport();

  return (
    <li>
      <div
        className={`flex items-start gap-1.5 px-2 py-1.5 transition-colors duration-150 hover:bg-zinc-50 ${
          activeThreadId === thread.id ? "bg-teal-50" : ""
        } ${variant === "deleted" ? "opacity-80" : ""}`}
      >
        {selectMode && variant === "active" ? (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(thread.id)}
            className="mt-1 h-3.5 w-3.5 rounded border-zinc-300 text-teal-600"
          />
        ) : null}
        <button
          type="button"
          onClick={() => onOpen(thread.id)}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="flex min-w-0 items-center gap-1 text-[11px] font-medium text-zinc-900">
              {thread.icon ? (
                <span className="shrink-0 text-xs">{thread.icon}</span>
              ) : null}
              <span className="line-clamp-1">{thread.subject}</span>
            </p>
            <span className="shrink-0 text-[9px] text-zinc-400">
              {formatThreadTimestamp(thread.last_message_at)}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-zinc-500">
            {thread.last_message_preview}
          </p>
        </button>
        {!selectMode ? (
          <SupportThreadMenu
            thread={thread}
            variant={variant}
            onRename={(id, subject) => {
              renameThread(id, subject);
              refresh();
            }}
            onArchive={(id) => {
              archiveThread(id);
              refresh();
            }}
            onDelete={(id) => {
              deleteThread(id);
              refresh();
            }}
            onUnarchive={(id) => {
              unarchiveThread(id);
              refresh();
            }}
            onRestore={(id) => {
              restoreThread(id);
              refresh();
            }}
            onPermanentDelete={(id) => {
              permanentlyDeleteThread(id);
              refresh();
            }}
          />
        ) : null}
      </div>
    </li>
  );
}

export function SupportSidebar() {
  const {
    threads,
    activeThreadId,
    setActiveThreadId,
    startNewChat,
    showArchived,
    setShowArchived,
    showRecentlyDeleted,
    setShowRecentlyDeleted,
    bulkArchiveThreads,
    bulkDeleteThreads,
    refresh,
  } = useSupport();
  const [query, setQuery] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);

  const displayed = (query.trim() ? searchThreads(query) : threads).filter(
    (t) => !t.archived && !t.deletedAt,
  );
  const archived = showArchived ? getArchivedThreads() : [];
  const recentlyDeleted = showRecentlyDeleted ? getRecentlyDeletedThreads() : [];

  function toggleSelect(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function openDeleteConfirm(ids: string[]) {
    setPendingDeleteIds(ids);
    setDeleteModalOpen(true);
  }

  function confirmDelete() {
    bulkDeleteThreads(pendingDeleteIds);
    setSelectedIds([]);
    setSelectMode(false);
    setDeleteModalOpen(false);
    setPendingDeleteIds([]);
    if (activeThreadId && pendingDeleteIds.includes(activeThreadId)) {
      setActiveThreadId(null);
    }
    refresh();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-zinc-100 p-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search conversations"
          className="w-full rounded-lg border border-zinc-200 px-2 py-1 text-[11px] outline-none transition-colors focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
        />
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => startNewChat()}
            className="rounded-lg bg-teal-600 px-2.5 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-teal-700"
          >
            New Chat
          </button>
          <SupportBulkActions
            selectMode={selectMode}
            selectedCount={selectedIds.length}
            onToggleSelectMode={() => {
              setSelectMode(!selectMode);
              setSelectedIds([]);
            }}
            onArchiveSelected={() => {
              bulkArchiveThreads(selectedIds);
              setSelectedIds([]);
              setSelectMode(false);
              refresh();
            }}
            onDeleteSelected={() => openDeleteConfirm(selectedIds)}
            onClearSelection={() => setSelectedIds([])}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <p className="px-2 pt-2 text-[9px] font-semibold uppercase tracking-wide text-zinc-400">
          Recent
        </p>
        <ul className="divide-y divide-zinc-50">
          {displayed.map((thread) => (
            <ThreadRow
              key={thread.id}
              thread={thread}
              activeThreadId={activeThreadId}
              selectMode={selectMode}
              selected={selectedIds.includes(thread.id)}
              onSelect={toggleSelect}
              onOpen={setActiveThreadId}
            />
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setShowArchived(!showArchived)}
          className="w-full px-2 py-1.5 text-left text-[9px] font-semibold uppercase tracking-wide text-zinc-400 hover:text-zinc-600"
        >
          Archived ({getArchivedThreads().length})
        </button>
        {showArchived ? (
          <ul className="divide-y divide-zinc-50">
            {archived.map((thread) => (
              <ThreadRow
                key={thread.id}
                thread={thread}
                activeThreadId={activeThreadId}
                selectMode={false}
                selected={false}
                onSelect={() => {}}
                onOpen={setActiveThreadId}
                variant="archived"
              />
            ))}
          </ul>
        ) : null}

        <button
          type="button"
          onClick={() => setShowRecentlyDeleted(!showRecentlyDeleted)}
          className="w-full px-2 py-1.5 text-left text-[9px] font-semibold uppercase tracking-wide text-zinc-400 hover:text-zinc-600"
        >
          Recently deleted ({getRecentlyDeletedThreads().length})
        </button>
        {showRecentlyDeleted ? (
          <ul className="divide-y divide-zinc-50">
            {recentlyDeleted.map((thread) => (
              <ThreadRow
                key={thread.id}
                thread={thread}
                activeThreadId={activeThreadId}
                selectMode={false}
                selected={false}
                onSelect={() => {}}
                onOpen={setActiveThreadId}
                variant="deleted"
              />
            ))}
          </ul>
        ) : null}
      </div>

      <p className="border-t border-zinc-100 px-2 py-1.5 text-[9px] text-zinc-400">
        Messages auto-delete after 6 months.
      </p>

      <SupportDeleteModal
        open={deleteModalOpen}
        count={pendingDeleteIds.length}
        onCancel={() => {
          setDeleteModalOpen(false);
          setPendingDeleteIds([]);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
