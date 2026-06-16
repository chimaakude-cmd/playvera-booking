"use client";

import { DISCOVERY_RADIUS } from "@/lib/discovery/constants";

type DiscoverySocialProofBarProps = {
  location: string;
  sessionCount: number;
};

export function DiscoverySocialProofBar({
  location,
  sessionCount,
}: DiscoverySocialProofBarProps) {
  const locationLabel = location.trim() || "you";

  return (
    <div className="my-4 px-4 sm:px-6">
      <div
        className={`discovery-social-proof mx-auto max-w-[1400px] ${DISCOVERY_RADIUS.card}`}
      >
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-3 text-xs font-semibold text-[#0F172A] sm:gap-x-8 sm:text-sm">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden>🔥</span>
            84 parents booked this week
          </span>
          <span className="hidden h-4 w-px bg-slate-200 sm:block" aria-hidden />
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden>⭐</span>
            4.9 avg rating
          </span>
          <span className="hidden h-4 w-px bg-slate-200 sm:block" aria-hidden />
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden>📍</span>
            {sessionCount} sessions near {locationLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
