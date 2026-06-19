"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClubProfileEditForm } from "@/components/club/profile/ClubProfileEditForm";
import { FranchiseeManagedBanner } from "@/components/club/FranchiseeManagedBanner";
import { LoadingState } from "@/components/club/LoadingState";
import { PageHeader } from "@/components/club/PageHeader";
import {
  fetchClubProfileFromApi,
  getClubProfile,
  getPublicClubPath,
  saveClubProfileToApi,
  type ClubProfile,
  type ClubProfileInput,
} from "@/lib/club-profile";

export default function EditClubProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedLive, setSavedLive] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ClubProfile | null>(null);

  useEffect(() => {
    async function load() {
      const apiResult = await fetchClubProfileFromApi();
      if (apiResult.ok) {
        setProfile(apiResult.profile);
      } else {
        setProfile(getClubProfile());
        if (apiResult.status && apiResult.status !== 404) {
          setSaveError(apiResult.error);
        }
      }
      setLoading(false);
    }

    void load();
  }, []);

  async function handleSave(input: ClubProfileInput) {
    setSaving(true);
    setSaveError(null);
    setSavedLive(false);

    const result = await saveClubProfileToApi(input);
    setSaving(false);

    if (!result.ok) {
      setSaveError(result.error);
      return;
    }

    setProfile(result.profile);
    setSavedLive(result.publishedLive);
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

      <FranchiseeManagedBanner providerId={profile.providerId} />

      {savedLive ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Your club page is now live and visible to parents.{" "}
          <Link
            href={getPublicClubPath(profile.publicSlug)}
            className="font-semibold underline"
          >
            View public page
          </Link>
        </div>
      ) : null}

      <ClubProfileEditForm
        initialProfile={profile}
        onSave={handleSave}
        saving={saving}
        saveError={saveError}
      />
    </div>
  );
}
