import {
  mapSessionRowsToClubSession,
  type SessionDateRow,
  type SessionRow,
  type TicketRow,
} from "@/lib/data/mappers/session-mapper";
import { filterBookableSessions } from "@/lib/sessions/bookable";
import {
  fetchPublicSessionByIdRow,
  fetchPublishedSessionsForProvider,
  type PublicSessionRow,
} from "@/lib/sessions/public-schema";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
  isSupabaseConfigured,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase";
import type { ClubSession } from "@/lib/sessions";

function groupBySessionId<T extends { session_id: string }>(rows: T[]) {
  const grouped = new Map<string, T[]>();

  for (const row of rows) {
    const current = grouped.get(row.session_id) ?? [];
    current.push(row);
    grouped.set(row.session_id, current);
  }

  return grouped;
}

function getPublicSupabaseClient() {
  return isSupabaseServiceRoleConfigured()
    ? createSupabaseServiceRoleClient()
    : createSupabaseServerClient();
}

async function loadSessionsWithRelatedData(
  rows: PublicSessionRow[],
): Promise<ClubSession[]> {
  if (rows.length === 0) {
    return [];
  }

  const supabase = getPublicSupabaseClient();
  const sessionIds = rows.map((row) => row.id);

  const [{ data: dateRows }, { data: ticketRows }] = await Promise.all([
    supabase
      .from("session_dates")
      .select("*")
      .in("session_id", sessionIds)
      .order("session_date", { ascending: true }),
    supabase
      .from("tickets")
      .select("*")
      .in("session_id", sessionIds)
      .order("sort_order", { ascending: true }),
  ]);

  const datesBySessionId = groupBySessionId(
    (dateRows ?? []) as SessionDateRow[],
  );
  const ticketsBySessionId = groupBySessionId(
    (ticketRows ?? []) as TicketRow[],
  );

  return rows.map((row) =>
    mapSessionRowsToClubSession(
      row as SessionRow,
      datesBySessionId.get(row.id) ?? [],
      ticketsBySessionId.get(row.id) ?? [],
    ),
  );
}

/** Published session for public booking links (/book/{id}), including sold-out. */
export async function getPublicSessionById(
  sessionId: string,
): Promise<ClubSession | null> {
  const trimmedId = sessionId.trim();

  if (!trimmedId || !isSupabaseConfigured()) {
    return null;
  }

  const supabase = getPublicSupabaseClient();
  const row = await fetchPublicSessionByIdRow(supabase, trimmedId);

  if (!row) {
    return null;
  }

  const [session] = await loadSessionsWithRelatedData([row]);
  return session ?? null;
}

export async function getBookableActivitiesForClub(
  providerId: string,
): Promise<ClubSession[]> {
  if (!providerId.trim() || !isSupabaseConfigured()) {
    return [];
  }

  const supabase = getPublicSupabaseClient();
  const rows = await fetchPublishedSessionsForProvider(supabase, providerId);

  if (rows.length === 0) {
    return [];
  }

  const sessions = await loadSessionsWithRelatedData(rows);

  return filterBookableSessions(sessions);
}

/** @deprecated Use getBookableActivitiesForClub */
export async function fetchPublicSessionsForProvider(
  providerId: string,
): Promise<ClubSession[]> {
  return getBookableActivitiesForClub(providerId);
}
