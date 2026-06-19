import { ClubNotFoundPage } from "@/components/club/public/ClubNotFoundPage";
import { ClubPublicPage } from "@/components/club/public/ClubPublicPage";
import { ClubPublicPageTracker } from "@/components/club/public/ClubPublicPageTracker";
import { fetchPublicClubProfileBySlug } from "@/lib/club-profile/server";
import { fetchPublicSessionsForProvider } from "@/lib/sessions/public-server";

export default async function PublicClubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await fetchPublicClubProfileBySlug(slug);

  if (!profile) {
    return <ClubNotFoundPage />;
  }

  const sessions = await fetchPublicSessionsForProvider(profile.providerId);

  return (
    <>
      <ClubPublicPageTracker />
      <ClubPublicPage profile={profile} sessions={sessions} />
    </>
  );
}
