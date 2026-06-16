"use client";

import { SafeImage } from "@/components/ui/SafeImage";

const LOGO_PATHS = {
  quickbooks: "/integrations/quickbooks.svg",
  freeagent: "/integrations/freeagent.svg",
  xero: "/integrations/xero.svg",
  sage: "/integrations/sage.svg",
} as const;

type BookkeepingProvider = keyof typeof LOGO_PATHS;

export function BookkeepingLogo({
  provider,
  className = "h-12 w-12",
}: {
  provider: BookkeepingProvider | string;
  className?: string;
}) {
  const src = LOGO_PATHS[provider as BookkeepingProvider];

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl bg-zinc-200 text-xs font-bold text-zinc-600 ${className}`}
      >
        ?
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-zinc-100 bg-white ${className}`}
    >
      <SafeImage
        src={src}
        alt={`${provider} logo`}
        fill
        className="object-contain p-1.5"
      />
    </div>
  );
}
