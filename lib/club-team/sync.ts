"use client";

import { isSupabaseConfigured } from "@/lib/supabase";
import type { ClubTeamState } from "./types";
import { applyClubTeamState, getClubTeamState } from "./storage";

export async function syncClubTeamFromServer(): Promise<ClubTeamState> {
  const local = getClubTeamState();

  if (!isSupabaseConfigured()) {
    return local;
  }

  try {
    const response = await fetch("/api/club/team", { credentials: "include" });
    if (!response.ok) {
      return local;
    }

    const payload = (await response.json()) as { team?: ClubTeamState };
    if (!payload.team?.members?.length) {
      return local;
    }

    return applyClubTeamState(payload.team);
  } catch {
    return local;
  }
}
