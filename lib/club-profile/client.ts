import type { ClubProfile, ClubProfileInput } from "./types";
import { cacheClubProfileLocally } from "./storage";

export type FetchClubProfileResult =
  | { ok: true; profile: ClubProfile }
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
      error?: string;
    };

    if (!response.ok || !payload.profile) {
      return {
        ok: false,
        error: payload.error ?? "Could not load club profile.",
        status: response.status,
      };
    }

    cacheClubProfileLocally(payload.profile);
    return { ok: true, profile: payload.profile };
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
