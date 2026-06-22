"use client";

import { useState } from "react";
import Link from "next/link";
import {
  repairClubProfileFromApi,
  type FetchClubProfileResult,
} from "@/lib/club-profile/client";
import type { ClubProfileHealth } from "@/lib/club-profile/health";
import { getPublicClubPath } from "@/lib/club-profile/types";

type ClubProfileHealthBadgeProps = {
  health: ClubProfileHealth;
  onRepaired?: (result: Extract<FetchClubProfileResult, { ok: true }>) => void;
  showRepairButton?: boolean;
  compact?: boolean;
};

export function ClubProfileHealthBadge({
  health,
  onRepaired,
  showRepairButton = true,
  compact = false,
}: ClubProfileHealthBadgeProps) {
  const [repairing, setRepairing] = useState(false);
  const [repairError, setRepairError] = useState<string | null>(null);

  async function handleRepair() {
    setRepairing(true);
    setRepairError(null);

    const result = await repairClubProfileFromApi();
    setRepairing(false);

    if (!result.ok) {
      setRepairError(result.error);
      return;
    }

    onRepaired?.(result);
  }

  if (health.isLive) {
    return (
      <div className={compact ? "space-y-2" : "space-y-3"}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
          Profile live
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"
          />
        </span>
        {!compact && health.readinessGaps.length > 0 ? (
          <ul className="list-inside list-disc text-xs text-zinc-600">
            {health.readinessGaps.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  const issueItems = [...health.reasons, ...health.readinessGaps.filter(
    (gap) => !health.reasons.includes(gap),
  )];

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
        Profile needs repair
      </span>
      {!compact && issueItems.length > 0 ? (
        <ul className="list-inside list-disc text-xs text-amber-900/90">
          {issueItems.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}
      {showRepairButton ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleRepair()}
            disabled={repairing}
            className="rounded-xl bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-800 disabled:opacity-60"
          >
            {repairing ? "Repairing…" : "Repair profile"}
          </button>
          {health.publiclyResolvable && health.publicPath ? (
            <Link
              href={getPublicClubPath(health.slug ?? "")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-amber-900 underline-offset-2 hover:underline"
            >
              Test public page
            </Link>
          ) : null}
        </div>
      ) : null}
      {repairError ? (
        <p className="text-xs text-rose-600">{repairError}</p>
      ) : null}
    </div>
  );
}
