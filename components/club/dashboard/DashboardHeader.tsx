"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { BRAND_NAME } from "@/lib/brand";

type DashboardHeaderProps = {
  clubName?: string;
  bookingsToday?: number;
  revenueToday?: string;
  unreadMessages?: number;
};

export function DashboardHeader({
  clubName = "Club",
  bookingsToday,
  revenueToday,
  unreadMessages,
}: DashboardHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const showStats =
    bookingsToday !== undefined ||
    revenueToday !== undefined ||
    unreadMessages !== undefined;

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();

    if (!trimmed) {
      return;
    }

    if (pathname.startsWith("/club/bookings")) {
      router.push(`/club/bookings?q=${encodeURIComponent(trimmed)}`);
      return;
    }

    router.push(`/club/activities?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-white via-white to-teal-50/40 p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Welcome back, {clubName}
          </h1>
          <p className="mt-1 text-sm font-medium text-teal-700">
            Today is {today}
          </p>
          <p className="mt-2 max-w-xl text-sm text-zinc-600">
            Your command centre on {BRAND_NAME}. See what needs attention today
            and keep families moving.
          </p>
          {showStats ? (
            <div className="mt-4 flex flex-wrap gap-3">
              {bookingsToday !== undefined ? (
                <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700">
                  Bookings today: {bookingsToday}
                </span>
              ) : null}
              {revenueToday ? (
                <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700">
                  Revenue today: {revenueToday}
                </span>
              ) : null}
              {unreadMessages !== undefined ? (
                <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700">
                  Unread messages: {unreadMessages}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <form
          onSubmit={handleSearch}
          className="flex w-full max-w-md items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-sm"
        >
          <span className="text-zinc-400" aria-hidden>
            ⌕
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search activities, bookings, parents..."
            className="min-w-0 flex-1 bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Search
          </button>
        </form>
      </div>
    </div>
  );
}

type QuickAction = {
  label: string;
  description: string;
  href: string;
  tone: "primary" | "neutral";
};

const quickActions: QuickAction[] = [
  {
    label: "Create activity",
    description: "Launch a new session parents can book",
    href: "/club/create-session",
    tone: "primary",
  },
  {
    label: "View bookings",
    description: "Check payments and attendance",
    href: "/club/bookings",
    tone: "neutral",
  },
  {
    label: "Manage venues",
    description: "Update locations and registers",
    href: "/club/settings",
    tone: "neutral",
  },
  {
    label: "Message parents",
    description: "Open communications hub",
    href: "/club/communications",
    tone: "neutral",
  },
];

export function DashboardQuickActions() {
  return (
    <div className="grid gap-3">
      {quickActions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className={`rounded-xl border px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 ${
            action.tone === "primary"
              ? "border-teal-200 bg-teal-50/70 hover:border-teal-300 hover:bg-teal-50"
              : "border-zinc-200 bg-zinc-50/60 hover:border-zinc-300 hover:bg-white"
          }`}
        >
          <p
            className={`text-sm font-semibold ${
              action.tone === "primary" ? "text-teal-800" : "text-zinc-900"
            }`}
          >
            {action.label}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{action.description}</p>
        </Link>
      ))}
    </div>
  );
}
