"use client";

import Link from "next/link";
import { ShareClubButton } from "@/components/club/share/ShareClubButton";
import { getClubProfile } from "@/lib/club-profile";

type BulkAction = "delete" | "archive" | "publish" | "export";

type ActivitiesHeaderProps = {
  selectedCount?: number;
  onBulkAction?: (action: BulkAction) => void;
};

export function ActivitiesHeader({
  selectedCount = 0,
  onBulkAction,
}: ActivitiesHeaderProps) {
  const profile = getClubProfile();
  const hasSelection = selectedCount > 0;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          Activities
        </h1>
        <p className="mt-1.5 text-sm leading-6 text-zinc-500 sm:text-base">
          Create, manage and track your sessions, availability and bookings.
        </p>
        {hasSelection ? (
          <p className="mt-1 text-sm font-medium text-teal-700">
            {selectedCount} selected
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <details className="group">
            <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 [&::-webkit-details-marker]:hidden">
              Bulk actions
              <span className="text-zinc-400">▾</span>
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                disabled={!hasSelection}
                onClick={() => onBulkAction?.("delete")}
                className="block w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-zinc-400 disabled:hover:bg-transparent"
              >
                Delete selected
              </button>
              <button
                type="button"
                disabled={!hasSelection}
                onClick={() => onBulkAction?.("archive")}
                className="block w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-400 disabled:hover:bg-transparent"
              >
                Archive selected
              </button>
              <button
                type="button"
                disabled={!hasSelection}
                onClick={() => onBulkAction?.("publish")}
                className="block w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-400 disabled:hover:bg-transparent"
              >
                Publish selected
              </button>
              <button
                type="button"
                onClick={() => onBulkAction?.("export")}
                className="block w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
              >
                Export
              </button>
            </div>
          </details>
        </div>

        <ShareClubButton
          clubName={profile.clubName}
          slug={profile.publicSlug}
          providerId={profile.providerId}
          logoUrl={profile.logoUrl}
          primaryColor={profile.branding.primaryColor}
          secondaryColor={profile.branding.secondaryColor}
          variant="default"
          label="Share"
        />

        <Link
          href="/club/create-session"
          className="inline-flex rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
        >
          + Add activity
        </Link>
      </div>
    </div>
  );
}
