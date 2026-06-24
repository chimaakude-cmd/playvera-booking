import type { ClubSession } from "@/lib/sessions";

export type PublicSessionResult = {
  session: ClubSession | null;
  source: "api" | "none";
  error?: string;
};

export async function fetchPublicSessionById(
  sessionId: string,
): Promise<PublicSessionResult> {
  const trimmedId = sessionId.trim();

  if (!trimmedId) {
    return { session: null, source: "none" };
  }

  try {
    const response = await fetch(
      `/api/public/sessions/${encodeURIComponent(trimmedId)}`,
      { cache: "no-store" },
    );

    if (response.status === 404) {
      return { session: null, source: "api" };
    }

    if (!response.ok) {
      return {
        session: null,
        source: "api",
        error: "Could not load session.",
      };
    }

    const payload = (await response.json()) as { session?: ClubSession };
    return {
      session: payload.session ?? null,
      source: "api",
    };
  } catch {
    return {
      session: null,
      source: "api",
      error: "Could not load session.",
    };
  }
}

export async function fetchBookableActivitiesForClub(
  providerId: string,
): Promise<ClubSession[]> {
  if (!providerId.trim()) {
    return [];
  }

  try {
    const response = await fetch(
      `/api/public/providers/${encodeURIComponent(providerId)}/sessions`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as { sessions?: ClubSession[] };
    return payload.sessions ?? [];
  } catch {
    return [];
  }
}
