import type { PostgrestError } from "@supabase/supabase-js";
import type { ActivoraSupabaseClient } from "@/lib/supabase";

export type PublicSessionRow = {
  id: string;
  published?: boolean | null;
  removed_at?: string | null;
  status?: string | null;
  deleted_at?: string | null;
  archived?: boolean | null;
  moderation_status?: string | null;
  visible?: boolean | null;
};

/** Matches club dashboard filterPublished: published !== false. */
export function isPublishedPublicSessionRow(row: PublicSessionRow): boolean {
  return row.published !== false;
}

/** Session is hidden from public booking when explicitly removed or archived. */
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

  if (row.visible === false) {
    return true;
  }

  if (
    row.status === "removed" ||
    row.status === "archived" ||
    row.status === "deleted" ||
    row.status === "draft"
  ) {
    return true;
  }

  return false;
}

export function isPublicSessionRow(row: PublicSessionRow): boolean {
  return isPublishedPublicSessionRow(row) && !isRemovedPublicSessionRow(row);
}

async function fetchAndFilterSessionRows(
  supabase: ActivoraSupabaseClient,
  buildQuery: (
    client: ActivoraSupabaseClient,
  ) => PromiseLike<{
    data: PublicSessionRow | PublicSessionRow[] | null;
    error: PostgrestError | null;
  }>,
): Promise<{
  rows: PublicSessionRow[];
  error: PostgrestError | null;
}> {
  const result = await buildQuery(supabase);

  if (result.error) {
    return { rows: [], error: result.error };
  }

  const data = result.data;
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
  const { rows, error } = await fetchAndFilterSessionRows(
    supabase,
    (client) =>
      client.from("sessions").select("*").eq("id", sessionId).maybeSingle(),
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
  const { rows, error } = await fetchAndFilterSessionRows(
    supabase,
    (client) =>
      client
        .from("sessions")
        .select("*")
        .eq("provider_id", providerId)
        .order("created_at", { ascending: false }),
  );

  if (error) {
    return [];
  }

  return rows;
}
