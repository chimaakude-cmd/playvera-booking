"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import type { ActivityRow } from "@/lib/club-activities";
import { imageStorage } from "@/lib/image-storage";
import {
  formatActivityType,
  formatSessionLocation,
  getSessionDateCount,
  getTicketPriceSummary,
} from "@/lib/sessions";
import { formatMoney } from "@/lib/payments";

type DrawerTab =
  | "overview"
  | "sessions"
  | "registers"
  | "reviews"
  | "finance"
  | "communications"
  | "share";

const TABS: Array<{ id: DrawerTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "sessions", label: "Sessions" },
  { id: "registers", label: "Registers" },
  { id: "reviews", label: "Reviews" },
  { id: "finance", label: "Finance" },
  { id: "communications", label: "Communications" },
  { id: "share", label: "Share" },
];

type ActivityOverviewDrawerProps = {
  row: ActivityRow | null;
  onClose: () => void;
  onShare: (row: ActivityRow) => void;
};

export function ActivityOverviewDrawer({
  row,
  onClose,
  onShare,
}: ActivityOverviewDrawerProps) {
  const [tab, setTab] = useState<DrawerTab>("overview");

  useEffect(() => {
    if (row) {
      setTab("overview");
    }
  }, [row]);

  useEffect(() => {
    if (!row) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [row, onClose]);

  if (!row) {
    return null;
  }

  const session = row.session;
  const imageUrl = imageStorage.getPreviewUrl(row.imageId);
  const monthlyRevenue = row.occupancy.filled * (session.price || 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close activity drawer"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-lg flex-col border-l border-zinc-200 bg-white shadow-2xl">
        <div className="border-b border-zinc-100 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-zinc-200">
                <SafeImage
                  src={imageUrl}
                  alt={row.title}
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-zinc-900">
                  {row.title}
                </h2>
                <p className="text-sm text-zinc-500">{row.ageRange}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-2.5 py-1 text-sm text-zinc-500 hover:bg-zinc-50"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 flex gap-1 overflow-x-auto pb-1">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tab === item.id
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {tab === "overview" ? (
            <div className="space-y-4">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-zinc-50 px-4 py-3">
                  <dt className="text-xs text-zinc-500">Type</dt>
                  <dd className="mt-1 text-sm font-semibold text-zinc-900">
                    {formatActivityType(session.activityType)}
                  </dd>
                </div>
                <div className="rounded-xl bg-zinc-50 px-4 py-3">
                  <dt className="text-xs text-zinc-500">Venue</dt>
                  <dd className="mt-1 text-sm font-semibold text-zinc-900">
                    {formatSessionLocation(session)}
                  </dd>
                </div>
                <div className="rounded-xl bg-zinc-50 px-4 py-3">
                  <dt className="text-xs text-zinc-500">Schedule</dt>
                  <dd className="mt-1 text-sm font-semibold text-zinc-900">
                    {row.timeRange}
                  </dd>
                </div>
                <div className="rounded-xl bg-zinc-50 px-4 py-3">
                  <dt className="text-xs text-zinc-500">Occupancy</dt>
                  <dd className="mt-1 text-sm font-semibold text-zinc-900">
                    {row.occupancy.filled}/{row.occupancy.capacity} (
                    {row.occupancy.percent}%)
                  </dd>
                </div>
              </dl>

              {session.description ? (
                <p className="text-sm leading-6 text-zinc-600">
                  {session.description}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/book/${row.id}`}
                  target="_blank"
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Preview public page
                </Link>
                <Link
                  href={`/club/sessions/${row.id}/edit`}
                  className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  Edit activity
                </Link>
              </div>
            </div>
          ) : null}

          {tab === "sessions" ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-600">
                {getSessionDateCount(session)} scheduled date
                {getSessionDateCount(session) === 1 ? "" : "s"} ·{" "}
                {getTicketPriceSummary(session)}
              </p>
              <Link
                href={`/club/sessions/${row.id}/edit`}
                className="inline-flex rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Manage schedule
              </Link>
            </div>
          ) : null}

          {tab === "registers" ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-600">
                Open the register for this activity to mark attendance and view
                child details.
              </p>
              <Link
                href={`/club/registers?session=${row.id}`}
                className="inline-flex rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Open register
              </Link>
            </div>
          ) : null}

          {tab === "reviews" ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-600">
                {row.reviews.count > 0
                  ? `${row.reviews.rating.toFixed(1)} average from ${row.reviews.count} review${row.reviews.count === 1 ? "" : "s"}.`
                  : "No reviews yet for this activity."}
              </p>
              <Link
                href="/club/reviews"
                className="inline-flex rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                View all reviews
              </Link>
            </div>
          ) : null}

          {tab === "finance" ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-600">
                Estimated revenue this month:{" "}
                <span className="font-semibold text-zinc-900">
                  {formatMoney(monthlyRevenue)}
                </span>
              </p>
              <Link
                href="/club/finance"
                className="inline-flex rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Open finance dashboard
              </Link>
            </div>
          ) : null}

          {tab === "communications" ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-600">
                Send updates and reminders to parents booked on this activity.
              </p>
              <Link
                href={`/club/communications?activity=${row.id}`}
                className="inline-flex rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Open communications
              </Link>
            </div>
          ) : null}

          {tab === "share" ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-600">
                Share your club page or embed this activity on your website.
              </p>
              <button
                type="button"
                onClick={() => onShare(row)}
                className="inline-flex rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Open share modal
              </button>
              <Link
                href="/club/growth/shares"
                className="block text-sm font-medium text-violet-700 hover:text-violet-900"
              >
                View share analytics
              </Link>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
