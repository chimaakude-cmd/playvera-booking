import {
  mapSessionRowsToClubSession,
  type SessionDateRow,
  type SessionRow,
  type TicketRow,
} from "@/lib/data/mappers/session-mapper";
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

export async function fetchPublicSessionsForProvider(
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

  const rows = sessionRows as SessionRow[];
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
      row,
      datesBySessionId.get(row.id) ?? [],
      ticketsBySessionId.get(row.id) ?? [],
    ),
  );
}
