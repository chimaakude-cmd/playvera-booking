"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  archiveNotification,
  formatNotificationTime,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from "@/lib/notifications";

const DROPDOWN_LIMIT = 20;

const TYPE_ICONS: Record<Notification["type"], string> = {
  bookings: "📅",
  refunds: "↩",
  messages: "💬",
  reviews: "⭐",
  payouts: "💷",
  system: "🔔",
  waitlist: "⏳",
};

type NotificationBellProps = {
  viewAllHref?: string;
  className?: string;
};

export function NotificationBell({
  viewAllHref = "/club/notifications",
  className = "",
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  function refresh() {
    setNotifications(getNotifications());
    setUnreadCount(getUnreadNotificationCount());
  }

  useEffect(() => {
    refresh();
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function handleClick(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const visible = notifications.slice(0, DROPDOWN_LIMIT);
  const hasMore = notifications.length > DROPDOWN_LIMIT;

  function handleOpenNotification(notification: Notification) {
    markNotificationRead(notification.id);
    refresh();
    setOpen(false);
  }

  return (
    <div className={`relative ${className}`} ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative rounded-xl border border-zinc-200 bg-white p-2 text-zinc-700 transition-colors hover:bg-zinc-50"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
      >
        <span aria-hidden className="text-base leading-none">
          🔔
        </span>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <p className="text-sm font-semibold text-zinc-900">Notifications</p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => {
                  markAllNotificationsRead();
                  refresh();
                }}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <ul className="max-h-80 overflow-y-auto">
            {visible.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-zinc-500">
                No notifications yet.
              </li>
            ) : (
              visible.map((notification) => (
                <li key={notification.id}>
                  {notification.href ? (
                    <Link
                      href={notification.href}
                      onClick={() => handleOpenNotification(notification)}
                      className={`block border-b border-zinc-50 px-4 py-3 transition-colors hover:bg-zinc-50 ${
                        notification.read ? "opacity-70" : "bg-teal-50/30"
                      }`}
                    >
                      <NotificationRow notification={notification} />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenNotification(notification)}
                      className={`block w-full border-b border-zinc-50 px-4 py-3 text-left transition-colors hover:bg-zinc-50 ${
                        notification.read ? "opacity-70" : "bg-teal-50/30"
                      }`}
                    >
                      <NotificationRow notification={notification} />
                    </button>
                  )}
                </li>
              ))
            )}
          </ul>

          {hasMore ? (
            <div className="border-t border-zinc-100 px-4 py-3">
              <Link
                href={viewAllHref}
                onClick={() => setOpen(false)}
                className="block text-center text-xs font-semibold text-teal-700 hover:text-teal-900"
              >
                View all notifications
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function NotificationRow({ notification }: { notification: Notification }) {
  return (
    <>
      <div className="flex items-start gap-2">
        <span className="text-sm" aria-hidden>
          {TYPE_ICONS[notification.type]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-zinc-900">
            {notification.title}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[11px] text-zinc-600">
            {notification.body}
          </p>
        </div>
        <span className="shrink-0 text-[10px] text-zinc-400">
          {formatNotificationTime(notification.createdAt)}
        </span>
      </div>
      {!notification.read ? (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              archiveNotification(notification.id);
            }}
            className="text-[10px] text-zinc-400 hover:text-zinc-600"
          >
            Archive
          </button>
        </div>
      ) : null}
    </>
  );
}
