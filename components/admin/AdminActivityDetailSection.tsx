"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/club/PageHeader";
import { ACTIVITY_STATUS_LABELS, type AdminActivity } from "@/lib/admin";

type Props = {
  activity: AdminActivity | null;
};

export function AdminActivityDetailSection({ activity }: Props) {
  const [saved, setSaved] = useState(false);

  if (!activity) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
        <p className="text-sm text-zinc-500">Activity not found.</p>
        <Link
          href="/admin/activities"
          className="mt-4 inline-block text-sm font-medium text-violet-700"
        >
          Back to activities
        </Link>
      </div>
    );
  }

  function handleStub(label: string) {
    window.alert(`${label} — stub for ${activity!.title}`);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={activity.title}
        description={`${activity.providerName} · ${ACTIVITY_STATUS_LABELS[activity.status]}`}
        action={
          <Link
            href="/admin/activities"
            className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Back to list
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleStub("Toggle visibility")}
          className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          {activity.visibility === "public" ? "Hide" : "Make public"}
        </button>
        <button
          type="button"
          onClick={() => handleStub("Pause")}
          className="rounded-xl border border-amber-200 px-3 py-2 text-xs font-medium text-amber-800 hover:bg-amber-50"
        >
          Pause
        </button>
        <button
          type="button"
          onClick={() => handleStub("Cancel")}
          className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50"
        >
          Cancel activity
        </button>
        <button
          type="button"
          onClick={() => handleStub("Duplicate")}
          className="rounded-xl border border-violet-200 px-3 py-2 text-xs font-medium text-violet-700 hover:bg-violet-50"
        >
          Duplicate
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSaved(true);
          }}
          className="space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-zinc-900">Activity details</h2>
          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Title</span>
            <input
              defaultValue={activity.title}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Provider</span>
            <input
              defaultValue={activity.providerName}
              disabled
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Price (£)</span>
            <input
              type="number"
              defaultValue={activity.price}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Save details
          </button>
          {saved ? (
            <p className="text-xs text-emerald-600">Saved (stub).</p>
          ) : null}
        </form>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSaved(true);
          }}
          className="space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-zinc-900">Schedule & venue</h2>
          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Day</span>
            <input
              defaultValue={activity.day}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-zinc-600">Start</span>
              <input
                defaultValue={activity.startTime}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-zinc-600">End</span>
              <input
                defaultValue={activity.endTime}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Venue</span>
            <input
              defaultValue={activity.venue}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Save schedule
          </button>
        </form>
      </div>

      <CapacityCard activity={activity} />
    </div>
  );
}

function CapacityCard({ activity }: { activity: AdminActivity }) {
  const fillPercent = Math.round(
    (activity.bookingsCount / activity.capacity) * 100,
  );

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-900">Capacity & bookings</h2>
      <div className="mt-4 flex items-end gap-6">
        <div>
          <p className="text-3xl font-bold text-zinc-900">
            {activity.bookingsCount}
            <span className="text-lg font-normal text-zinc-400">
              /{activity.capacity}
            </span>
          </p>
          <p className="text-xs text-zinc-500">Bookings</p>
        </div>
        <div className="flex-1">
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-violet-600"
              style={{ width: `${Math.min(fillPercent, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-zinc-500">{fillPercent}% full</p>
        </div>
      </div>
    </div>
  );
}
