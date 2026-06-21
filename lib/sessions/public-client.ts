import type { ClubSession } from "@/lib/sessions";

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
