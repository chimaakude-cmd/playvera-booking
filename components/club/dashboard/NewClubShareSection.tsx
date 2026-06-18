"use client";

import { ShareClubButton } from "@/components/club/share/ShareClubButton";
import { getClubPublicUrl } from "@/lib/club-share";

type NewClubShareSectionProps = {
  clubName: string;
  slug: string;
  providerId: string;
  logoUrl?: string | null;
};

export function NewClubShareSection({
  clubName,
  slug,
  providerId,
  logoUrl,
}: NewClubShareSectionProps) {
  const shareUrl =
    typeof window !== "undefined"
      ? getClubPublicUrl(slug, { baseUrl: window.location.origin })
      : getClubPublicUrl(slug);

  function handleCopyLink() {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }
    void navigator.clipboard.writeText(shareUrl);
  }

  return (
    <section className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-zinc-900">Share your profile</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Your club is ready to be shared. Copy your link or share directly with
        parents.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-600">
          <span className="block truncate">{shareUrl}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50"
          >
            Copy link
          </button>
          <ShareClubButton
            clubName={clubName}
            slug={slug}
            providerId={providerId}
            logoUrl={logoUrl}
            variant="teal"
            label="Share"
          />
        </div>
      </div>
    </section>
  );
}
