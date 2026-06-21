"use client";

import Link from "next/link";
import {
  getProfileDescription,
  getProfileLocationLabel,
} from "@/lib/club/new-club-mode";
import {
  getPublicClubPath,
  type ClubProfile,
} from "@/lib/club-profile/types";
import type { ClubSession } from "@/lib/sessions";

type PublicProfilePreviewProps = {
  profile: ClubProfile;
  sessions?: ClubSession[];
};

export function PublicProfilePreview({
  profile,
  sessions = [],
}: PublicProfilePreviewProps) {
  const logoUrl =
    profile.logoUrl?.trim() || profile.profileDesign?.logoUrl?.trim() || null;
  const description = getProfileDescription(profile);
  const locationLabel = getProfileLocationLabel(profile, sessions);
  const previewPath = getPublicClubPath(profile.publicSlug);
  const profileLive =
    profile.clubName.trim().length > 0 &&
    Boolean(profile.publicSlug?.trim());

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">
            Your public profile
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            What parents will see — your personal details stay private.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            profileLive
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
              : "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
          }`}
        >
          {profileLive ? "Profile live" : "Setting up profile"}
        </span>
      </div>

      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-violet-50 text-lg font-bold text-violet-700">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            profile.clubName.slice(0, 1).toUpperCase()
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-zinc-900">
            {profile.clubName}
          </h3>
          <p className="mt-2 text-sm text-zinc-600">{description}</p>
          <p className="mt-3 text-sm text-zinc-500">{locationLabel}</p>
        </div>

        <Link
          href={previewPath}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-800 transition-colors hover:bg-violet-100"
        >
          Preview profile
        </Link>
      </div>
    </section>
  );
}
