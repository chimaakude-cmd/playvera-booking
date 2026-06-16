import { shouldUseSupabaseSessions } from "@/lib/data/config";
import { localStorageDataLayer } from "@/lib/data/providers/local-storage";
import { createSupabaseSessionsRepository } from "@/lib/data/providers/supabase/sessions-repository";
import { saveSessionToSupabase } from "@/lib/data/session-save";
import { SupabaseSaveError } from "@/lib/data/supabase-errors";
import { isSupabaseConfigured } from "@/lib/supabase";
import type {
  SessionsQueryOptions,
  SessionsRepository,
  SessionsResult,
} from "@/lib/data/types";
import type { ClubSession } from "@/lib/sessions";

function filterPublished(
  sessions: ClubSession[],
  options?: SessionsQueryOptions,
): ClubSession[] {
  if (!options?.publishedOnly) {
    return sessions;
  }

  return sessions.filter((session) => session.published !== false);
}

function getSupabaseSessionsSetupMessage(): string {
  return (
    "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and " +
    "NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, run " +
    "supabase/migrations/00005_dev_anon_access.sql, then restart the dev server."
  );
}

function assertSupabaseReady(): void {
  if (!shouldUseSupabaseSessions() || !isSupabaseConfigured()) {
    throw new SupabaseSaveError(getSupabaseSessionsSetupMessage());
  }
}

export function createResilientSessionsRepository(): SessionsRepository {
  const supabaseRepository = createSupabaseSessionsRepository();

  return {
    async getAll(options) {
      assertSupabaseReady();
      const sessions = await supabaseRepository.getAll(options);
      return filterPublished(sessions, options);
    },

    async getById(id) {
      assertSupabaseReady();
      return supabaseRepository.getById(id);
    },

    async save(session) {
      assertSupabaseReady();
      return saveSessionToSupabase(session);
    },

    async update(id, updates) {
      assertSupabaseReady();
      return supabaseRepository.update(id, updates);
    },

    async delete(id) {
      assertSupabaseReady();
      return supabaseRepository.delete(id);
    },

    async incrementBookings(sessionId) {
      assertSupabaseReady();
      await supabaseRepository.incrementBookings(sessionId);
    },
  };
}

export async function loadSessionsWithMeta(
  options?: SessionsQueryOptions,
): Promise<SessionsResult<ClubSession[]>> {
  if (!shouldUseSupabaseSessions()) {
    const data = filterPublished(
      await localStorageDataLayer.sessions.getAll(options),
      options,
    );
    return { data, source: "localStorage" };
  }

  if (!isSupabaseConfigured()) {
    return {
      data: [],
      source: "supabase",
      error: getSupabaseSessionsSetupMessage(),
    };
  }

  try {
    const repository = createResilientSessionsRepository();
    const data = await repository.getAll(options);
    return { data, source: "supabase" };
  } catch (error) {
    return {
      data: [],
      source: "supabase",
      error:
        error instanceof Error
          ? error.message
          : "Could not load sessions from Supabase.",
    };
  }
}

export async function saveSessionWithMeta(
  session: Omit<ClubSession, "id" | "bookings" | "createdAt">,
): Promise<SessionsResult<ClubSession>> {
  assertSupabaseReady();
  const saved = await saveSessionToSupabase(session);

  return {
    data: saved,
    source: "supabase",
  };
}
