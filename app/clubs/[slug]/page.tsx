import Link from "next/link";
import { ClubPublicPage } from "@/components/club/public/ClubPublicPage";
import { ClubPublicPageTracker } from "@/components/club/public/ClubPublicPageTracker";
import { fetchPublicClubProfileBySlug } from "@/lib/club-profile/server";
import { getSessions } from "@/lib/sessions";

export default async function PublicClubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await fetchPublicClubProfileBySlug(slug);
  const sessions = getSessions().filter((session) => session.published !== false);

  if (!profile) {
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

  return (
    <>
      <ClubPublicPageTracker />
      <ClubPublicPage profile={profile} sessions={sessions} />
    </>
  );
}
