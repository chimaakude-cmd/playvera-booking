import type { PostgrestError } from "@supabase/supabase-js";
import type { ActivoraSupabaseClient } from "@/lib/supabase";
import { isMissingColumnError } from "@/lib/providers/payment-schema";

export type PublicSessionRow = {
  id: string;
  published?: boolean | null;
  moderation_status?: "active" | "removed" | null;
  removed_at?: string | null;
  status?: string | null;
  deleted_at?: string | null;
  archived?: boolean | null;
  visible?: boolean | null;
};

/** Mirrors 00064 RLS: session is publicly bookable when published/visible and not removed. */
export function isPublishedPublicSessionRow(row: PublicSessionRow): boolean {
  if (row.published === true) {
    return true;
  }

  if (row.status === "published") {
    return true;
  }

  if (row.visible === true) {
    return true;
  }

  return (
    row.published !== false &&
    row.visible !== false &&
    row.status !== "draft" &&
    row.status !== "removed" &&
    row.status !== "archived" &&
    row.status !== "deleted"
  );
}

/** Mirrors 00064 RLS removal checks across legacy and moderation columns. */
export function isRemovedPublicSessionRow(row: PublicSessionRow): boolean {
  if (row.moderation_status === "removed") {
    return true;
  }

  if (row.removed_at) {
    return true;
  }

  if (row.deleted_at) {
    return true;
  }

  if (row.archived === true) {
    return true;
  }

  if (
    row.status === "removed" ||
    row.status === "archived" ||
    row.status === "deleted"
  ) {
    return true;
  }

  return row.visible === false;
}

export function isPublicSessionRow(row: PublicSessionRow): boolean {
  return isPublishedPublicSessionRow(row) && !isRemovedPublicSessionRow(row);
}

async function queryPublishedSessions(
  supabase: ActivoraSupabaseClient,
  buildQuery: (
    client: ActivoraSupabaseClient,
    usePublishedFilter: boolean,
  ) => PromiseLike<{
    data: PublicSessionRow | PublicSessionRow[] | null;
    error: PostgrestError | null;
  }>,
): Promise<{
  rows: PublicSessionRow[];
  error: PostgrestError | null;
}> {
  const primary = await buildQuery(supabase, true);

  if (!primary.error) {
    const data = primary.data;
    const rows = Array.isArray(data)
      ? data
      : data
        ? [data]
        : [];

    return {
      rows: rows.filter(isPublicSessionRow),
      error: null,
    };
  }

  if (!isMissingColumnError(primary.error)) {
    return { rows: [], error: primary.error };
  }

  const fallback = await buildQuery(supabase, false);

  if (fallback.error) {
    return { rows: [], error: fallback.error };
  }

  const data = fallback.data;
  const rows = Array.isArray(data) ? data : data ? [data] : [];

  return {
    rows: rows.filter(isPublicSessionRow),
    error: null,
  };
}

export async function fetchPublicSessionByIdRow(
  supabase: ActivoraSupabaseClient,
  sessionId: string,
): Promise<PublicSessionRow | null> {
  const { rows, error } = await queryPublishedSessions(
    supabase,
    (client, usePublishedFilter) => {
      let query = client.from("sessions").select("*").eq("id", sessionId);

      if (usePublishedFilter) {
        query = query.eq("published", true);
      }

      return query.maybeSingle();
    },
  );

  if (error) {
    return null;
  }

  return rows[0] ?? null;
}

export async function fetchPublishedSessionsForProvider(
  supabase: ActivoraSupabaseClient,
  providerId: string,
): Promise<PublicSessionRow[]> {
  const { rows, error } = await queryPublishedSessions(
    supabase,
    (client, usePublishedFilter) => {
      let query = client
        .from("sessions")
        .select("*")
        .eq("provider_id", providerId)
        .order("created_at", { ascending: false });

      if (usePublishedFilter) {
        query = query.eq("published", true);
      }

      return query;
    },
  );

  if (error) {
    return [];
  }

  return rows;
}
