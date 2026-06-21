import {
  mapSessionRowsToClubSession,
  type SessionDateRow,
  type SessionRow,
  type TicketRow,
} from "@/lib/data/mappers/session-mapper";
import { filterBookableSessions } from "@/lib/sessions/bookable";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
  isSupabaseConfigured,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase";
import type { ClubSession } from "@/lib/sessions";

type PublicSessionRow = SessionRow & {
  moderation_status?: "active" | "removed" | null;
};

function groupBySessionId<T extends { session_id: string }>(rows: T[]) {
  const grouped = new Map<string, T[]>();

  for (const row of rows) {
    const current = grouped.get(row.session_id) ?? [];
    current.push(row);
    grouped.set(row.session_id, current);
  }

  return grouped;
}

function isRemovedSessionRow(row: PublicSessionRow): boolean {
  return row.moderation_status === "removed";
}

export async function getBookableActivitiesForClub(
  providerId: string,
): Promise<ClubSession[]> {
  if (!providerId.trim() || !isSupabaseConfigured()) {
    return [];
  }

  const supabase = isSupabaseServiceRoleConfigured()
    ? createSupabaseServiceRoleClient()
    : createSupabaseServerClient();

  const { data: sessionRows, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("provider_id", providerId)
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error || !sessionRows?.length) {
    return [];
  }

  const rows = (sessionRows as PublicSessionRow[]).filter(
    (row) => !isRemovedSessionRow(row),
  );

  if (rows.length === 0) {
    return [];
  }

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

  const sessions = rows.map((row) =>
    mapSessionRowsToClubSession(
      row,
      datesBySessionId.get(row.id) ?? [],
      ticketsBySessionId.get(row.id) ?? [],
    ),
  );

  return filterBookableSessions(sessions);
}

/** @deprecated Use getBookableActivitiesForClub */
export async function fetchPublicSessionsForProvider(
  providerId: string,
): Promise<ClubSession[]> {
  return getBookableActivitiesForClub(providerId);
}
