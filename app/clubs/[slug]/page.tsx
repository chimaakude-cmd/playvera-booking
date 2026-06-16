"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClubPublicPage } from "@/components/club/public/ClubPublicPage";
import { getClubProfileBySlug } from "@/lib/club-profile";
import type { ClubProfile } from "@/lib/club-profile";
import { trackProfileVisit, trackShareEvent } from "@/lib/club-share";
import { ClubSession, getSessions } from "@/lib/sessions";

export default function PublicClubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [slug, setSlug] = useState<string | null>(null);
  const [profile, setProfile] = useState<ClubProfile | null>(null);
  const [sessions, setSessions] = useState<ClubSession[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function load() {
      const resolved = await params;
      setSlug(resolved.slug);
      const clubProfile = getClubProfileBySlug(resolved.slug);
      setProfile(clubProfile);
      setSessions(getSessions().filter((session) => session.published !== false));
      setReady(true);
    }

    void load();
  }, [params]);

  useEffect(() => {
    if (!ready || !profile) {
      return;
    }
    trackProfileVisit();
    const params = new URLSearchParams(window.location.search);
    if (params.get("src") === "qr") {
      trackShareEvent("qr_scan");
    }
  }, [ready, profile]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8fa] text-sm text-zinc-500">
        Loading club...
      </div>
    );
  }

  if (!profile || !slug) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f8fa] px-6 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">Club not found</h1>
        <p className="mt-2 max-w-md text-sm text-zinc-500">
          This club page is not published or does not exist yet.
        </p>
        <Link
          href="/sessions"
          className="mt-6 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Browse activities
        </Link>
      </div>
    );
  }

  return <ClubPublicPage profile={profile} sessions={sessions} />;
}
