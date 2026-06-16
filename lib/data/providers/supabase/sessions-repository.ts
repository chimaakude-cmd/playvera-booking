import {
  mapClubSessionDatesToInsert,
  mapClubSessionTicketsToInsert,
  mapSessionRowsToClubSession,
  type SessionDateRow,
  type SessionRow,
  type TicketRow,
} from "@/lib/data/mappers/session-mapper";
import { buildSessionInsertPayload } from "@/lib/data/mappers/session-insert";
import { saveSessionToSupabase } from "@/lib/data/session-save";
import { getOrCreateDefaultProviderId } from "@/lib/data/providers/supabase/default-provider";
import { formatPostgrestError } from "@/lib/data/supabase-errors";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import type { ClubSession } from "@/lib/sessions";
import type { SessionsRepository } from "@/lib/data/types";

function groupBySessionId<T extends { session_id: string }>(rows: T[]) {
  const grouped = new Map<string, T[]>();

  for (const row of rows) {
    const current = grouped.get(row.session_id) ?? [];
    current.push(row);
    grouped.set(row.session_id, current);
  }

  return grouped;
}

async function fetchRelatedSessionData(sessionIds: string[]) {
  if (sessionIds.length === 0) {
    return {
      datesBySessionId: new Map<string, SessionDateRow[]>(),
      ticketsBySessionId: new Map<string, TicketRow[]>(),
    };
  }

  const supabase = getSupabaseBrowserClient();

  const [{ data: dateRows, error: datesError }, { data: ticketRows, error: ticketsError }] =
    await Promise.all([
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

  if (datesError) {
    throw new Error(formatPostgrestError("session_dates select", datesError));
  }

  if (ticketsError) {
    throw new Error(formatPostgrestError("tickets select", ticketsError));
  }

  return {
    datesBySessionId: groupBySessionId((dateRows ?? []) as SessionDateRow[]),
    ticketsBySessionId: groupBySessionId((ticketRows ?? []) as TicketRow[]),
  };
}

async function mapRowsToClubSessions(rows: SessionRow[]): Promise<ClubSession[]> {
  const { datesBySessionId, ticketsBySessionId } = await fetchRelatedSessionData(
    rows.map((row) => row.id),
  );

  return rows.map((row) =>
    mapSessionRowsToClubSession(
      row,
      datesBySessionId.get(row.id) ?? [],
      ticketsBySessionId.get(row.id) ?? [],
    ),
  );
}

export function createSupabaseSessionsRepository(): SessionsRepository {
  return {
    async getAll(options) {
      if (!isSupabaseConfigured()) {
        throw new Error("Supabase is not configured.");
      }

      const supabase = getSupabaseBrowserClient();
      let query = supabase
        .from("sessions")
        .select("*")
        .order("created_at", { ascending: false });

      if (options?.publishedOnly) {
        query = query.eq("published", true);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(formatPostgrestError("sessions select", error));
      }

      return mapRowsToClubSessions((data ?? []) as SessionRow[]);
    },

    async getById(id) {
      if (!isSupabaseConfigured()) {
        throw new Error("Supabase is not configured.");
      }

      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw new Error(formatPostgrestError("sessions select", error));
      }

      if (!data) {
        return undefined;
      }

      const { datesBySessionId, ticketsBySessionId } = await fetchRelatedSessionData([
        id,
      ]);

      return mapSessionRowsToClubSession(
        data as SessionRow,
        datesBySessionId.get(id) ?? [],
        ticketsBySessionId.get(id) ?? [],
      );
    },

    async save(session) {
      return saveSessionToSupabase({
        ...session,
        published: session.published ?? true,
      });
    },

    async update(id, updates) {
      if (!isSupabaseConfigured()) {
        throw new Error("Supabase is not configured.");
      }

      const existing = await this.getById(id);
      if (!existing) {
        return null;
      }

      const merged: ClubSession = {
        ...existing,
        ...updates,
        id,
        bookings: existing.bookings,
        createdAt: existing.createdAt,
      };

      const supabase = getSupabaseBrowserClient();
      const providerId = await getOrCreateDefaultProviderId();
      const sessionRow = buildSessionInsertPayload(merged, providerId, id);

      const { error: sessionError } = await supabase
        .from("sessions")
        .update({
          ...sessionRow,
          id,
          bookings_count: merged.bookings,
        })
        .eq("id", id);

      if (sessionError) {
        throw new Error(formatPostgrestError("sessions update", sessionError));
      }

      await supabase.from("session_dates").delete().eq("session_id", id);
      await supabase.from("tickets").delete().eq("session_id", id);

      const dateRows = mapClubSessionDatesToInsert(
        id,
        merged.schedule?.dates ?? [],
      );
      const ticketRows = mapClubSessionTicketsToInsert(id, merged.tickets);

      if (dateRows.length > 0) {
        const { error: datesError } = await supabase
          .from("session_dates")
          .insert(dateRows);

        if (datesError) {
          throw new Error(formatPostgrestError("session_dates insert", datesError));
        }
      }

      if (ticketRows.length > 0) {
        const { error: ticketsError } = await supabase
          .from("tickets")
          .insert(ticketRows);

        if (ticketsError) {
          throw new Error(formatPostgrestError("tickets insert", ticketsError));
        }
      }

      return (await this.getById(id)) ?? null;
    },

    async delete(id) {
      if (!isSupabaseConfigured()) {
        throw new Error("Supabase is not configured.");
      }

      const supabase = getSupabaseBrowserClient();
      const { error, count } = await supabase
        .from("sessions")
        .delete({ count: "exact" })
        .eq("id", id);

      if (error) {
        throw new Error(formatPostgrestError("sessions delete", error));
      }

      return (count ?? 0) > 0;
    },

    async incrementBookings(sessionId) {
      if (!isSupabaseConfigured()) {
        throw new Error("Supabase is not configured.");
      }

      const supabase = getSupabaseBrowserClient();
      const existing = await this.getById(sessionId);

      if (!existing) {
        return;
      }

      const { error } = await supabase
        .from("sessions")
        .update({ bookings_count: existing.bookings + 1 })
        .eq("id", sessionId);

      if (error) {
        throw new Error(formatPostgrestError("sessions update bookings_count", error));
      }
    },
  };
}