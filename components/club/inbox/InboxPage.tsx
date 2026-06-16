"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/club/EmptyState";
import { LoadingState } from "@/components/club/LoadingState";
import { getCurrentClubRole, roleHasPermission } from "@/lib/club-team";
import {
  archive,
  filter,
  getUnreadCounts,
  markAllRead,
  markRead,
  openSupportDrawer,
  type InboxCategory,
  type InboxItem,
} from "@/lib/inbox";
import { InboxDetailPanel } from "./InboxDetailPanel";

const CATEGORIES: { key: InboxCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "messages", label: "Messages" },
  { key: "notifications", label: "Notifications" },
  { key: "reviews", label: "Reviews" },
  { key: "bookings", label: "Bookings" },
  { key: "payments", label: "Payments" },
  { key: "system", label: "System" },
];

const TYPE_ICONS: Record<InboxItem["type"], string> = {
  message: "💬",
  notification: "📣",
  review: "⭐",
  booking: "📅",
  payment: "💷",
  system: "⚙️",
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function InboxItemRow({
  item,
  selected,
  onSelect,
}: {
  item: InboxItem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full gap-3 border-b border-zinc-100 px-4 py-3.5 text-left transition-colors last:border-b-0 ${
        selected ? "bg-teal-50/60" : "hover:bg-zinc-50"
      }`}
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-base">
        {TYPE_ICONS[item.type]}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`truncate text-sm ${
              item.status === "unread"
                ? "font-semibold text-zinc-900"
                : "font-medium text-zinc-700"
            }`}
          >
            {item.title}
          </p>
          <span className="shrink-0 text-xs text-zinc-400">
            {formatRelativeTime(item.timestamp)}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm leading-5 text-zinc-500">
          {item.preview}
        </p>
      </div>
      {item.status === "unread" ? (
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-teal-500" />
      ) : (
        <span className="mt-2 h-2 w-2 shrink-0" />
      )}
    </button>
  );
}

function InboxContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = getCurrentClubRole();
  const canView = roleHasPermission(role, "view_inbox");

  const initialCategory = (searchParams.get("cat") as InboxCategory) ?? "all";
  const [category, setCategory] = useState<InboxCategory>(
    CATEGORIES.some((c) => c.key === initialCategory) ? initialCategory : "all",
  );
  const [query, setQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [archivedOnly, setArchivedOnly] = useState(false);
  const [highPriorityOnly, setHighPriorityOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (searchParams.get("newChat") === "1") {
      openSupportDrawer({ newChat: true });
      router.replace("/club/inbox", { scroll: false });
    }
    if (searchParams.get("filter") === "unread") {
      setUnreadOnly(true);
      setArchivedOnly(false);
    }
  }, [searchParams, router]);

  const counts = useMemo(() => {
    void refreshKey;
    return getUnreadCounts();
  }, [refreshKey]);

  const items = useMemo(() => {
    void refreshKey;
    return filter({
      category,
      query,
      unreadOnly,
      archivedOnly,
      highPriorityOnly,
    });
  }, [category, query, unreadOnly, archivedOnly, highPriorityOnly, refreshKey]);

  const selected = items.find((i) => i.id === selectedId) ?? null;

  function handleCategoryChange(next: InboxCategory) {
    setCategory(next);
    setSelectedId(null);
    const params = next === "all" ? "" : `?cat=${next}`;
    router.replace(`/club/inbox${params}`, { scroll: false });
  }

  function handleSelect(item: InboxItem) {
    setSelectedId(item.id);
    if (item.status === "unread") {
      markRead(item.id);
      refresh();
    }
  }

  function handleMarkAllRead() {
    markAllRead(category);
    refresh();
  }

  function handleArchive() {
    if (!selected) return;
    archive(selected.id);
    setSelectedId(null);
    refresh();
  }

  if (!canView) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-zinc-200/80 bg-white px-6 py-14 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Access restricted</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-500">
            Your role does not include access to the club inbox. Contact a manager
            or owner if you need message or notification access.
          </p>
          <Link
            href="/club/dashboard"
            className="mt-6 inline-flex rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Inbox
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Messages, notifications, bookings, payments, and alerts in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openSupportDrawer({ newChat: true })}
            className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
          >
            New chat
          </button>
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Mark all read
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search inbox…"
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:max-w-xs"
            />
            <div className="flex flex-wrap gap-2">
              <FilterChip
                active={unreadOnly}
                onClick={() => {
                  setUnreadOnly((v) => !v);
                  setArchivedOnly(false);
                }}
                label="Unread"
              />
              <FilterChip
                active={archivedOnly}
                onClick={() => {
                  setArchivedOnly((v) => !v);
                  setUnreadOnly(false);
                }}
                label="Archived"
              />
              <FilterChip
                active={highPriorityOnly}
                onClick={() => setHighPriorityOnly((v) => !v)}
                label="High priority"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:min-h-[560px]">
          <aside className="border-b border-zinc-100 lg:w-52 lg:shrink-0 lg:border-b-0 lg:border-r">
            <div className="flex gap-1 overflow-x-auto p-2 lg:flex-col lg:overflow-visible lg:p-3">
              {CATEGORIES.map(({ key, label }) => {
                const count = key === "all" ? counts.all : counts[key];
                const active = category === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleCategoryChange(key)}
                    className={`flex shrink-0 items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors lg:w-full ${
                      active
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    <span>{label}</span>
                    {count > 0 ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          active
                            ? "bg-white/20 text-white"
                            : "bg-teal-50 text-teal-700"
                        }`}
                      >
                        {count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="flex min-h-[320px] flex-1 flex-col lg:flex-row">
            <div
              className={`flex-1 overflow-y-auto lg:max-w-md lg:border-r lg:border-zinc-100 ${
                selected ? "hidden lg:block" : ""
              }`}
            >
              {items.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    title="Nothing here"
                    description={
                      archivedOnly
                        ? "No archived items in this category."
                        : "You're all caught up — no items match your filters."
                    }
                  />
                </div>
              ) : (
                items.map((item) => (
                  <InboxItemRow
                    key={item.id}
                    item={item}
                    selected={selectedId === item.id}
                    onSelect={() => handleSelect(item)}
                  />
                ))
              )}
            </div>

            {selected ? (
              <div className="flex-1 lg:min-w-0">
                <InboxDetailPanel
                  item={selected}
                  onArchive={handleArchive}
                  onClose={() => setSelectedId(null)}
                />
              </div>
            ) : (
              <div className="hidden flex-1 items-center justify-center bg-zinc-50/50 p-8 lg:flex">
                <p className="text-sm text-zinc-400">
                  Select an item to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "bg-teal-600 text-white"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
      }`}
    >
      {label}
    </button>
  );
}

export function InboxPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading inbox…" />}>
      <InboxContent />
    </Suspense>
  );
}
