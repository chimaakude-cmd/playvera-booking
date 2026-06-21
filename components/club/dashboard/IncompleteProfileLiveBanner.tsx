"use client";

import Link from "next/link";
import type { ClubProfile } from "@/lib/club-profile/types";
import type { ClubProfileHealth } from "@/lib/club-profile/health";

function isPublicProfileContentComplete(profile: ClubProfile): boolean {
  const description =
    profile.shortDescription?.trim() ||
    profile.longDescription?.trim() ||
    profile.profileDesign?.aboutText?.trim() ||
    "";

  const hasLogo = Boolean(
    profile.logoUrl?.trim() || profile.profileDesign?.logoUrl?.trim(),
  );

  return (
    hasLogo &&
    description.length > 0 &&
    profile.clubName.trim().length > 0 &&
    profile.categories.length > 0
  );
}

type IncompleteProfileLiveBannerProps = {
  profile: ClubProfile;
  health: ClubProfileHealth;
};

export function IncompleteProfileLiveBanner({
  profile,
  health,
}: IncompleteProfileLiveBannerProps) {
  if (
    !health.isLive ||
    isPublicProfileContentComplete(profile)
  ) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-4 sm:px-5">
      <p className="text-sm font-medium text-teal-950">
        Your club profile is live. Add more details to improve how it looks to
        parents.
      </p>
      <Link
        href="/club/settings/profile"
        className="mt-2 inline-flex text-sm font-semibold text-teal-800 hover:text-teal-900"
      >
        Improve your profile →
      </Link>
    </div>
  );
}
