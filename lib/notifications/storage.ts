import {
  NOTIFICATIONS_STORAGE_KEY,
  type Notification,
} from "./types";

export const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: "notif_001",
    type: "bookings",
    title: "New booking",
    body: "Emma Thompson booked Football Skills — Tuesday 4pm.",
    href: "/club/bookings",
    read: false,
    archived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: "notif_002",
    type: "payouts",
    title: "Stripe payout completed",
    body: "£842.50 has been paid to your connected bank account.",
    href: "/club/finance?tab=payouts",
    read: false,
    archived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "notif_003",
    type: "reviews",
    title: "New parent review",
    body: "Sarah M. left a 5-star review for Holiday Camp Week 1.",
    href: "/club/reviews",
    read: false,
    archived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: "notif_004",
    type: "refunds",
    title: "Refund requested",
    body: "James P. requested a refund for booking #BK-2041.",
    href: "/club/bookings",
    read: true,
    archived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "notif_005",
    type: "system",
    title: "Session starts tomorrow",
    body: "Multi-Sports After School has 18 bookings — check your register.",
    href: "/club/registers",
    read: true,
    archived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
  },
  {
    id: "notif_006",
    type: "messages",
    title: "Unread parent message",
    body: "Helen Wright replied to your session update campaign.",
    href: "/club/communications",
    read: false,
    archived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
];

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readNotifications(): Notification[] {
  if (!isBrowser()) {
    return SEED_NOTIFICATIONS;
  }
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(SEED_NOTIFICATIONS),
      );
      return SEED_NOTIFICATIONS;
    }
    return JSON.parse(raw) as Notification[];
  } catch {
    return SEED_NOTIFICATIONS;
  }
}

function writeNotifications(notifications: Notification[]): void {
  if (!isBrowser()) {
    return;
  }
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
}

export function getNotifications(includeArchived = false): Notification[] {
  const items = readNotifications().filter((n) => includeArchived || !n.archived);
  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getUnreadNotificationCount(): number {
  return getNotifications().filter((n) => !n.read).length;
}

export function markNotificationRead(id: string): void {
  writeNotifications(
    readNotifications().map((n) =>
      n.id === id ? { ...n, read: true } : n,
    ),
  );
}

export function markAllNotificationsRead(): void {
  writeNotifications(
    readNotifications().map((n) => ({ ...n, read: true })),
  );
}

export function archiveNotification(id: string): void {
  writeNotifications(
    readNotifications().map((n) =>
      n.id === id ? { ...n, archived: true, read: true } : n,
    ),
  );
}

export function formatNotificationTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) {
    return `${Math.max(1, diffMins)}m ago`;
  }
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
