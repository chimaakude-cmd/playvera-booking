"use client";

import type { SharePlatform } from "@/lib/club-share";
import { SharePlatformIcon } from "./sharePlatformIcons";

type SharePlatformButtonProps = {
  platform: SharePlatform;
  label: string;
  ariaLabel: string;
  onClick: () => void;
};

export function SharePlatformButton({
  platform,
  label,
  ariaLabel,
  onClick,
}: SharePlatformButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-100 bg-zinc-50/80 px-2 py-3 text-center transition-all hover:scale-105 hover:border-zinc-200 hover:bg-zinc-100"
    >
      <span className="flex h-9 w-9 items-center justify-center">
        <SharePlatformIcon platform={platform} />
      </span>
      <span className="text-[10px] font-medium leading-tight text-zinc-700 sm:text-xs">
        {label}
      </span>
    </button>
  );
}
