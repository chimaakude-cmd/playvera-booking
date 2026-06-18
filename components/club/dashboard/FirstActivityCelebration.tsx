"use client";

import Link from "next/link";
import { ShareClubButton } from "@/components/club/share/ShareClubButton";

type FirstActivityCelebrationProps = {
  clubName: string;
  slug: string;
  providerId: string;
  logoUrl?: string | null;
  onDismiss: () => void;
};

export function FirstActivityCelebration({
  clubName,
  slug,
  providerId,
  logoUrl,
  onDismiss,
}: FirstActivityCelebrationProps) {
  return (
    <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-violet-50 p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-2xl font-semibold text-zinc-900">
            🎉 Your club is live.
          </p>
          <p className="mt-2 max-w-xl text-sm text-zinc-600">
            Your first activity is published. Parents can now discover and book
            with {clubName}.
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-700"
        >
          Dismiss
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/club/activities"
          className="inline-flex rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-800"
        >
          View activity
        </Link>
        <ShareClubButton
          clubName={clubName}
          slug={slug}
          providerId={providerId}
          logoUrl={logoUrl}
          variant="teal"
          label="Share activity"
        />
      </div>
    </section>
  );
}
