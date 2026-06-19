"use client";

import { useEffect, useState } from "react";
import { ShareClubButton } from "@/components/club/share/ShareClubButton";
import { getSharePrompt, type SharePrompt } from "@/lib/club-share";
import type { ClubProfileVisibility } from "@/lib/club-profile/types";

type SharePromptBannerProps = {
  clubName: string;
  slug: string;
  providerId: string;
  logoUrl?: string | null;
  visibility?: ClubProfileVisibility;
  published?: boolean;
};

export function SharePromptBanner({
  clubName,
  slug,
  providerId,
  logoUrl,
  visibility,
  published,
}: SharePromptBannerProps) {
  const [prompt, setPrompt] = useState<SharePrompt | null>(null);

  useEffect(() => {
    setPrompt(getSharePrompt());
  }, []);

  if (!prompt) {
    return null;
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
        prompt.variant === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-teal-200 bg-teal-50 text-teal-900"
      }`}
    >
      <p className="text-sm font-medium">{prompt.message}</p>
      <ShareClubButton
        clubName={clubName}
        slug={slug}
        providerId={providerId}
        logoUrl={logoUrl}
        visibility={visibility}
        published={published}
        variant="teal"
        label={prompt.ctaLabel}
      />
    </div>
  );
}
