"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShareClubButton } from "@/components/club/share/ShareClubButton";
import { ClubProfileSummary } from "@/components/club/profile/ClubProfileSummary";
import { FranchiseeManagedBanner } from "@/components/club/FranchiseeManagedBanner";
import { LoadingState } from "@/components/club/LoadingState";
import { PageHeader } from "@/components/club/PageHeader";
import { getClubProfile } from "@/lib/club-profile";
import type { ClubProfile } from "@/lib/club-profile";

export default function ClubProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ClubProfile | null>(null);

  useEffect(() => {
    setProfile(getClubProfile());
    setLoading(false);
  }, []);

  if (loading || !profile) {
    return <LoadingState message="Loading club profile..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Club profile"
        description="Your customer-facing source of truth for parents discovering and trusting your club."
        action={
          <div className="flex flex-wrap gap-2">
            <ShareClubButton
              clubName={profile.clubName}
              slug={profile.publicSlug}
              providerId={profile.providerId}
              logoUrl={profile.logoUrl}
              primaryColor={profile.branding.primaryColor}
              secondaryColor={profile.branding.secondaryColor}
              variant="teal"
            />
            <Link
              href="/club/settings/profile/edit"
              className="inline-flex rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              Edit club profile
            </Link>
          </div>
        }
      />
      <FranchiseeManagedBanner />
      <ClubProfileSummary profile={profile} />
    </div>
  );
}
