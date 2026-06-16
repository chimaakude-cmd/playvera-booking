"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClubProfileEditForm } from "@/components/club/profile/ClubProfileEditForm";
import { FranchiseeManagedBanner } from "@/components/club/FranchiseeManagedBanner";
import { LoadingState } from "@/components/club/LoadingState";
import { PageHeader } from "@/components/club/PageHeader";
import {
  getClubProfile,
  getPublicClubPath,
  saveClubProfile,
  type ClubProfile,
  type ClubProfileInput,
} from "@/lib/club-profile";

export default function EditClubProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState<ClubProfile | null>(null);

  useEffect(() => {
    setProfile(getClubProfile());
    setLoading(false);
  }, []);

  function handleSave(input: ClubProfileInput) {
    const next = saveClubProfile(input);
    setProfile(next);
    setSaved(true);
  }

  if (loading || !profile) {
    return <LoadingState message="Loading club profile..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit club profile"
        description="Update how your club appears to parents across Activora."
        action={
          <Link
            href="/club/settings/profile"
            className="inline-flex rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50"
          >
            Back to profile
          </Link>
        }
      />

      <FranchiseeManagedBanner />

      {saved ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Club profile saved locally.
          {profile.published ? (
            <>
              {" "}
              <Link
                href={getPublicClubPath(profile.publicSlug)}
                className="font-semibold underline"
              >
                View public page
              </Link>
            </>
          ) : null}
        </div>
      ) : null}

      <ClubProfileEditForm initialProfile={profile} onSave={handleSave} />
    </div>
  );
}
