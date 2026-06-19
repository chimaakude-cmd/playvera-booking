import { getThreads, isThreadEnded } from "@/lib/support";
import { isDevelopmentEnvironment } from "@/lib/admin-users/production-gates";
import { INBOX_STORAGE_KEY, SEED_INBOX_ITEMS } from "./defaults";
import type {
  InboxCategory,
  InboxFilterOptions,
  InboxItem,
  InboxItemStatus,
  InboxUnreadCounts,
} from "./types";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readJson<T>(fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }
  try {
    const raw = localStorage.getItem(INBOX_STORAGE_KEY);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(value: T): void {
  if (!isBrowser()) {
    return;
  }
  localStorage.setItem(INBOX_STORAGE_KEY, JSON.stringify(value));
}

function ensureSeeded(): InboxItem[] {
  const existing = readJson<InboxItem[] | null>(null);
  if (!existing || existing.length === 0) {
    if (!isDevelopmentEnvironment()) {
      writeJson([]);
      return [];
    }

    writeJson(SEED_INBOX_ITEMS);
    return structuredClone(SEED_INBOX_ITEMS);
  }
  return existing;
}

const CLUB_SUPPORT_CONTEXTS = new Set(["club_signed_in", "club_onboarding"]);

function supportThreadToInboxItem(
  thread: ReturnType<typeof getThreads>[number],
  stored?: InboxItem,
): InboxItem {
  const id = `thread_${thread.id}`;
  return {
    id,
    type: "message",
    category: "messages",
    title: thread.subject,
    preview: thread.last_message_preview || "No messages yet",
    timestamp: thread.last_message_at,
    status:
      stored?.status ??
      (isThreadEnded(thread.status) ? "read" : "unread"),
    priority:
      thread.status === "waiting" && thread.support_mode === "human"
        ? "high"
        : "normal",
    threadId: thread.id,
    body: thread.last_message_preview,
    metadata: {
      contactName: thread.contact_name,
      threadStatus: thread.status,
      supportMode: thread.support_mode,
    },
  };
}

function mergeSupportThreads(items: InboxItem[]): InboxItem[] {
  const storedById = new Map(items.map((item) => [item.id, item]));
  const supportThreads = getThreads(true).filter((t) =>
    CLUB_SUPPORT_CONTEXTS.has(t.context),
  );

  const messageItems = supportThreads.map((thread) =>
    supportThreadToInboxItem(thread, storedById.get(`thread_${thread.id}`)),
  );

  const nonMessageItems = items.filter((item) => item.type !== "message");
  const merged = [...messageItems, ...nonMessageItems];

  return merged.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function getInboxItems(): InboxItem[] {
  const items = ensureSeeded();
  return mergeSupportThreads(items);
}

function saveItems(items: InboxItem[]): void {
  writeJson(items);
}

function categoryForItem(item: InboxItem): Exclude<InboxCategory, "all"> {
  return item.category;
}

export function getUnreadCounts(): InboxUnreadCounts {
  const items = getInboxItems().filter((item) => item.status !== "archived");
  const counts: InboxUnreadCounts = {
    all: 0,
    messages: 0,
    notifications: 0,
    reviews: 0,
    bookings: 0,
    payments: 0,
    system: 0,
  };

  for (const item of items) {
    if (item.status === "unread") {
      counts.all += 1;
      counts[categoryForItem(item)] += 1;
    }
  }

  return counts;
}

export function getTotalUnreadCount(): number {
  return getUnreadCounts().all;
}

export function markRead(id: string): InboxItem | null {
  const items = getInboxItems();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) {
    return null;
  }
  const updated = { ...items[index], status: "read" as InboxItemStatus };
  items[index] = updated;
  saveItems(items);
  return updated;
}

export function markAllRead(category: InboxCategory = "all"): number {
  const items = getInboxItems();
  let count = 0;

  const next = items.map((item) => {
    if (item.status !== "unread") {
      return item;
    }
    if (category !== "all" && item.category !== category) {
      return item;
    }
    count += 1;
    return { ...item, status: "read" as InboxItemStatus };
  });

  saveItems(next);
  return count;
}

export function archive(id: string): InboxItem | null {
  const items = getInboxItems();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) {
    return null;
  }
  const updated = { ...items[index], status: "archived" as InboxItemStatus };
  items[index] = updated;
  saveItems(items);
  return updated;
}

export function search(query: string, options: InboxFilterOptions = {}): InboxItem[] {
  return filter({ ...options, query });
}

export function filter(options: InboxFilterOptions = {}): InboxItem[] {
  const {
    category = "all",
    query = "",
    highPriorityOnly = false,
    unreadOnly = false,
    archivedOnly = false,
  } = options;

  let items = getInboxItems();

  if (archivedOnly) {
    items = items.filter((item) => item.status === "archived");
  } else {
    items = items.filter((item) => item.status !== "archived");
  }

  if (unreadOnly) {
    items = items.filter((item) => item.status === "unread");
  }

  if (highPriorityOnly) {
    items = items.filter((item) => item.priority === "high");
  }

  if (category !== "all") {
    items = items.filter((item) => item.category === category);
  }

  const q = query.trim().toLowerCase();
  if (q) {
    items = items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.preview.toLowerCase().includes(q) ||
        item.body?.toLowerCase().includes(q),
    );
  }

  return items;
}

export function getInboxItemById(id: string): InboxItem | undefined {
  return getInboxItems().find((item) => item.id === id);
}

/** Open the global Support Centre drawer (loaded via SupportBundle). */
const PENDING_SUPPORT_OPEN_KEY = "activora:support-pending-open";

export function openSupportDrawer(options?: {
  newChat?: boolean;
  threadId?: string;
}): void {
  if (!isBrowser()) {
    return;
  }
  sessionStorage.setItem(PENDING_SUPPORT_OPEN_KEY, JSON.stringify(options ?? {}));
  window.dispatchEvent(
    new CustomEvent("activora:open-support", {
      detail: options ?? {},
    }),
  );
}

export function consumePendingSupportOpen(): {
  newChat?: boolean;
  threadId?: string;
} | null {
  if (!isBrowser()) {
    return null;
  }
  const raw = sessionStorage.getItem(PENDING_SUPPORT_OPEN_KEY);
  if (!raw) {
    return null;
  }
  sessionStorage.removeItem(PENDING_SUPPORT_OPEN_KEY);
  try {
    return JSON.parse(raw) as { newChat?: boolean; threadId?: string };
  } catch {
    return null;
  }
}
