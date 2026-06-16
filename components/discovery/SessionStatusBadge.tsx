"use client";

import type { SessionStatusBadge } from "@/lib/discovery/session-badge";
import { DISCOVERY_RADIUS } from "@/lib/discovery/constants";

type SessionStatusBadgeProps = {
  badge: SessionStatusBadge;
  className?: string;
};

const BADGE_STYLES: Record<SessionStatusBadge["kind"], string> = {
  "sold-out": "border-red-200/90 bg-red-50/95 text-red-800",
  "few-spaces-left": "border-orange-200/90 bg-orange-50/95 text-orange-800",
  "limited-availability": "border-orange-200/90 bg-orange-50/95 text-orange-800",
  popular: "border-amber-200/90 bg-amber-50/95 text-amber-900",
  "filling-fast": "border-violet-200/90 bg-violet-50/95 text-violet-900",
  "space-available": "border-emerald-200/90 bg-emerald-50/95 text-emerald-800",
  "new-session": "border-blue-200/90 bg-blue-50/95 text-blue-800",
  "starting-soon": "border-slate-200/90 bg-slate-50/95 text-slate-800",
};

export function SessionStatusBadge({
  badge,
  className = "",
}: SessionStatusBadgeProps) {
  const animationClass = badge.animate ? "discovery-session-status-badge--pulse" : "";

  return (
    <span
      className={`discovery-session-status-badge inline-flex items-center gap-1 border px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm sm:text-xs ${DISCOVERY_RADIUS.searchPill} ${BADGE_STYLES[badge.kind]} ${animationClass} ${className}`}
      title={badge.tooltip}
    >
      <span aria-hidden>{badge.emoji}</span>
      <span>{badge.label}</span>
    </span>
  );
}
