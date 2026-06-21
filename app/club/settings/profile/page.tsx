"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShareClubButton } from "@/components/club/share/ShareClubButton";
import { ClubProfileSummary } from "@/components/club/profile/ClubProfileSummary";
import { FranchiseeManagedBanner } from "@/components/club/FranchiseeManagedBanner";
import { LoadingState } from "@/components/club/LoadingState";
import { PageHeader } from "@/components/club/PageHeader";
import {
  fetchClubProfileFromApi,
  getClubProfile,
  type ClubProfile,
} from "@/lib/club-profile";
import {
  assessClubProfileHealth,
  type ClubProfileHealth,
} from "@/lib/club-profile/health";

export default function ClubProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ClubProfile | null>(null);
  const [health, setHealth] = useState<ClubProfileHealth | null>(null);

  useEffect(() => {
    async function load() {
      const apiResult = await fetchClubProfileFromApi();
      const nextProfile = apiResult.ok ? apiResult.profile : getClubProfile();
      setProfile(nextProfile);
      setHealth(
        apiResult.ok
          ? apiResult.health
          : assessClubProfileHealth({
              providerExists: true,
              providerSlug: nextProfile.publicSlug,
              profile: nextProfile,
              publiclyResolvable: false,
            }),
      );
      setLoading(false);
    }

    void load();
  }, []);

  if (loading || !profile || !health) {
    return <LoadingState message="Loading club profile..." />;
  }

  const publicSlug = health.slug ?? profile.publicSlug;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Club profile"
        description="Your customer-facing source of truth for parents discovering and trusting your club."
        action={
          <div className="flex flex-wrap gap-2">
            <ShareClubButton
              clubName={profile.clubName}
              slug={publicSlug}
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
      <FranchiseeManagedBanner providerId={profile.providerId} />
      <ClubProfileSummary profile={profile} health={health} />
    </div>
  );
}
