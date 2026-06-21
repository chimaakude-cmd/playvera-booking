import type { SetupProgressResult } from "./types";

export type FetchSetupProgressResult =
  | { ok: true; progress: SetupProgressResult }
  | { ok: false; error: string };

export async function fetchSetupProgressFromApi(): Promise<FetchSetupProgressResult> {
  try {
    const response = await fetch("/api/club/setup-progress", {
      cache: "no-store",
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      return {
        ok: false,
        error: payload?.error ?? "Could not load setup progress.",
      };
    }

    const payload = (await response.json()) as { progress: SetupProgressResult };
    return { ok: true, progress: payload.progress };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not load setup progress.",
    };
  }
}
