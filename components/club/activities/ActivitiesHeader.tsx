"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ShareClubButton } from "@/components/club/share/ShareClubButton";
import { fetchClubProfileFromApi } from "@/lib/club-profile/client";
import { getClubProfile } from "@/lib/club-profile";
import type { ClubProfile } from "@/lib/club-profile";

type BulkAction = "delete" | "archive" | "publish" | "export";

export type BulkActionAvailability = {
  delete: boolean;
  archive: boolean;
  publish: boolean;
};

type ActivitiesHeaderProps = {
  selectedCount?: number;
  bulkAvailability?: BulkActionAvailability;
  onBulkAction?: (action: BulkAction) => void;
};

function bulkMenuButtonClass(enabled: boolean, tone: "danger" | "default"): string {
  if (enabled) {
    return tone === "danger"
      ? "cursor-pointer text-rose-600 hover:bg-rose-50"
      : "cursor-pointer text-zinc-700 hover:bg-zinc-50";
  }

  return "cursor-not-allowed opacity-40 text-zinc-400 hover:bg-transparent";
}

export function ActivitiesHeader({
  selectedCount = 0,
  bulkAvailability = { delete: false, archive: false, publish: false },
  onBulkAction,
}: ActivitiesHeaderProps) {
  const [profile, setProfile] = useState<ClubProfile>(() => getClubProfile());
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const hasSelection = selectedCount > 0;

  useEffect(() => {
    let cancelled = false;

    void fetchClubProfileFromApi().then((result) => {
      if (cancelled || !result.ok) {
        return;
      }

      setProfile(result.profile);
    });

    return () => {
      cancelled = true;
    };
  }, []);
  const bulkLabel = hasSelection
    ? `Bulk actions (${selectedCount} selected)`
    : "Bulk actions";

  function closeMenu() {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  }

  function handleAction(action: BulkAction, enabled: boolean) {
    if (action !== "delete" && !enabled) {
      return;
    }

    if (action === "delete" && !hasSelection) {
      return;
    }

    closeMenu();
    onBulkAction?.(action);
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          Activities
        </h1>
        <p className="mt-1.5 text-sm leading-6 text-zinc-500 sm:text-base">
          Create, manage and track your sessions, availability and bookings.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <details ref={detailsRef} className="group">
            <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 [&::-webkit-details-marker]:hidden">
              {bulkLabel}
              <span className="text-zinc-400">▾</span>
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={() => handleAction("delete", bulkAvailability.delete)}
                className={`block w-full px-4 py-2 text-left text-sm transition-colors ${bulkMenuButtonClass(
                  bulkAvailability.delete,
                  "danger",
                )}`}
              >
                Delete selected
              </button>
              <button
                type="button"
                onClick={() => handleAction("archive", bulkAvailability.archive)}
                className={`block w-full px-4 py-2 text-left text-sm transition-colors ${bulkMenuButtonClass(
                  bulkAvailability.archive,
                  "default",
                )}`}
              >
                Archive selected
              </button>
              <button
                type="button"
                onClick={() => handleAction("publish", bulkAvailability.publish)}
                className={`block w-full px-4 py-2 text-left text-sm transition-colors ${bulkMenuButtonClass(
                  bulkAvailability.publish,
                  "default",
                )}`}
              >
                Publish selected
              </button>
              <button
                type="button"
                onClick={() => handleAction("export", true)}
                className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
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
          visibility={profile.visibility}
          published={profile.published}
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
