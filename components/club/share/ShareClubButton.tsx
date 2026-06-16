"use client";

import { useState } from "react";
import { ShareClubModal } from "./ShareClubModal";

type ShareClubButtonProps = {
  clubName: string;
  slug: string;
  providerId: string;
  logoUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  variant?: "default" | "primary" | "teal";
  label?: string;
  className?: string;
};

export function ShareClubButton({
  clubName,
  slug,
  providerId,
  logoUrl,
  primaryColor,
  secondaryColor,
  variant = "default",
  label = "Share club",
  className = "",
}: ShareClubButtonProps) {
  const [open, setOpen] = useState(false);

  const variantClass =
    variant === "primary"
      ? "rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
      : variant === "teal"
        ? "rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
        : "rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 ${variantClass} ${className}`}
      >
        <ShareIcon />
        {label}
      </button>
      <ShareClubModal
        open={open}
        onClose={() => setOpen(false)}
        clubName={clubName}
        slug={slug}
        providerId={providerId}
        logoUrl={logoUrl}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
      />
    </>
  );
}

function ShareIcon() {
  return (
    <svg
      aria-hidden
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
      />
    </svg>
  );
}
