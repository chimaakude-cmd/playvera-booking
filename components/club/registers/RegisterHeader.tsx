"use client";

import Link from "next/link";
import type { RegisterGridMeta } from "@/lib/club-registers";
import { formatSessionDateLabel, formatSessionTimeLabel } from "@/lib/session-wizard";

type RegisterHeaderProps = {
  meta: RegisterGridMeta;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onExport: () => void;
  canExport: boolean;
};

export function RegisterHeader({
  meta,
  searchQuery,
  onSearchChange,
  onExport,
  canExport,
}: RegisterHeaderProps) {
  const dateLabel = meta.isBlockMode
    ? meta.blockLabel
    : formatSessionDateLabel(meta.sessionDates[0]?.date ?? "");

  return (
    <header className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm print:border-2 print:border-zinc-300 print:shadow-none">
      <div className="flex flex-col gap-4 border-b border-zinc-100 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/club/registers"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 print:hidden"
          >
            <span aria-hidden>←</span>
            Back to registers
          </Link>
          {meta.isBlockMode ? (
            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 ring-1 ring-teal-200">
              Block booking
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 print:text-black">
              Session register
            </p>
            <h1 className="mt-1 text-xl font-bold text-zinc-900 sm:text-2xl">
              {meta.activityTitle}
            </h1>
            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-600">
              <div>
                <dt className="sr-only">Venue</dt>
                <dd>{meta.venue}</dd>
              </div>
              <div>
                <dt className="sr-only">Date</dt>
                <dd>{dateLabel}</dd>
              </div>
              <div>
                <dt className="sr-only">Time</dt>
                <dd>
                  {formatSessionTimeLabel(meta.startTime, meta.endTime)}
                </dd>
              </div>
              <div>
                <dt className="sr-only">Capacity</dt>
                <dd className="font-semibold text-zinc-800">
                  {meta.capacityFilled}/{meta.capacity} = {meta.capacityPercent}%
                </dd>
              </div>
            </dl>
            {meta.usingDemoData ? (
              <p className="mt-2 text-xs font-medium text-amber-700">
                Example register — includes block booking and example booking scenarios.
              </p>
            ) : null}
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto print:hidden">
            <label className="relative flex-1 sm:min-w-[220px]">
              <span className="sr-only">Search booking</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search child or parent…"
                className="w-full rounded-xl border border-zinc-200 py-2.5 pl-10 pr-3 text-sm"
              />
              <span
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                aria-hidden
              >
                ⌕
              </span>
            </label>
            {canExport ? (
              <button
                type="button"
                onClick={onExport}
                className="min-h-11 shrink-0 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Export
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
