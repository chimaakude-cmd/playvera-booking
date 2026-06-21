import type { ClubProfileHealth } from "./health";
import type { ClubProfile, ClubProfileInput } from "./types";
import { cacheClubProfileLocally } from "./storage";

export type FetchClubProfileResult =
  | { ok: true; profile: ClubProfile; health: ClubProfileHealth }
  | { ok: false; error: string; status?: number };

export type RepairClubProfileResult =
  | { ok: true; profile: ClubProfile; health: ClubProfileHealth }
  | { ok: false; error: string; status?: number };

export type SaveClubProfileResult =
  | { ok: true; profile: ClubProfile; publishedLive: boolean }
  | {
      ok: false;
      error: string;
      publishErrors?: Record<string, string>;
      status?: number;
    };

export async function fetchClubProfileFromApi(): Promise<FetchClubProfileResult> {
  try {
    const response = await fetch("/api/club/profile", {
      method: "GET",
      credentials: "include",
    });

    const payload = (await response.json()) as {
      profile?: ClubProfile;
      health?: ClubProfileHealth;
      error?: string;
    };

    if (!response.ok || !payload.profile || !payload.health) {
      return {
        ok: false,
        error: payload.error ?? "Could not load club profile.",
        status: response.status,
      };
    }

    cacheClubProfileLocally(payload.profile);
    return {
      ok: true,
      profile: payload.profile,
      health: payload.health,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not load club profile.",
    };
  }
}

export async function repairClubProfileFromApi(): Promise<RepairClubProfileResult> {
  try {
    const response = await fetch("/api/club/profile/repair", {
      method: "POST",
      credentials: "include",
    });

    const payload = (await response.json()) as {
      profile?: ClubProfile;
      health?: ClubProfileHealth;
      error?: string;
    };

    if (!response.ok || !payload.profile || !payload.health) {
      return {
        ok: false,
        error: payload.error ?? "Could not repair club profile.",
        status: response.status,
      };
    }

    cacheClubProfileLocally(payload.profile);
    return {
      ok: true,
      profile: payload.profile,
      health: payload.health,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not repair club profile.",
    };
  }
}

export async function saveClubProfileToApi(
  input: ClubProfileInput,
): Promise<SaveClubProfileResult> {
  try {
    const response = await fetch("/api/club/profile", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const payload = (await response.json()) as {
      profile?: ClubProfile;
      error?: string;
      publishErrors?: Record<string, string>;
    };

    if (!response.ok || !payload.profile) {
      return {
        ok: false,
        error: payload.error ?? "Could not save club profile.",
        publishErrors: payload.publishErrors,
        status: response.status,
      };
    }

    cacheClubProfileLocally(payload.profile);

    const visibility =
      payload.profile.visibility ??
      (payload.profile.published ? "published" : "draft");

    return {
      ok: true,
      profile: payload.profile,
      publishedLive: visibility === "published" || visibility === "hidden",
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not save club profile.",
    };
  }
}
