import type { ActivityStatus, ActivityVisibility, AdminActivity } from "@/lib/admin/types";
import { formatDay } from "@/lib/sessions";
import { adminListDataSource } from "@/lib/admin/data-source";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase";

export type AdminActivitiesListResult = {
  activities: AdminActivity[];
  dataSource: "supabase" | "env_missing";
};

type SessionRow = {
  id: string;
  provider_id: string;
  session_title: string;
  venue_name: string;
  location: string;
  day: string;
  start_time: string;
  end_time: string;
  capacity: number;
  bookings_count: number;
  price: number;
  published: boolean;
  created_at: string;
  providers: { name: string } | { name: string }[] | null;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function formatTime(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "—";
  }

  const match = trimmed.match(/^(\d{1,2}:\d{2})/);
  return match?.[1] ?? trimmed;
}

function deriveStatus(published: boolean): ActivityStatus {
  return published ? "published" : "draft";
}

function deriveVisibility(published: boolean): ActivityVisibility {
  return published ? "public" : "hidden";
}

function mapSessionRow(row: SessionRow): AdminActivity {
  const provider = firstRelation(row.providers);

  return {
    id: row.id,
    title: row.session_title.trim() || "Untitled activity",
    providerId: row.provider_id,
    providerName: provider?.name.trim() || "—",
    venue: row.venue_name.trim() || row.location.trim() || "—",
    day: row.day ? formatDay(row.day) : "—",
    startTime: formatTime(row.start_time),
    endTime: formatTime(row.end_time),
    capacity: Number(row.capacity ?? 0),
    bookingsCount: Number(row.bookings_count ?? 0),
    price: Number(row.price ?? 0),
    status: deriveStatus(Boolean(row.published)),
    visibility: deriveVisibility(Boolean(row.published)),
    createdAt: row.created_at,
  };
}

async function fetchSessionRows(): Promise<SessionRow[] | null> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("sessions")
    .select(
      `
        id,
        provider_id,
        session_title,
        venue_name,
        location,
        day,
        start_time,
        end_time,
        capacity,
        bookings_count,
        price,
        published,
        created_at,
        providers (
          name
        )
      `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Admin activities] Failed to load sessions:", error.message);
    return null;
  }

  return (data ?? []) as unknown as SessionRow[];
}

export async function fetchAdminActivitiesList(): Promise<AdminActivitiesListResult> {
  const dataSource = adminListDataSource();
  if (dataSource === "env_missing") {
    return { activities: [], dataSource: "env_missing" };
  }

  const rows = await fetchSessionRows();

  return {
    activities: (rows ?? []).map(mapSessionRow),
    dataSource: "supabase",
  };
}

export async function fetchAdminActivityById(
  id: string,
): Promise<AdminActivity | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("sessions")
    .select(
      `
        id,
        provider_id,
        session_title,
        venue_name,
        location,
        day,
        start_time,
        end_time,
        capacity,
        bookings_count,
        price,
        published,
        created_at,
        providers (
          name
        )
      `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(
      `[Admin activities] Failed to load session ${id}:`,
      error.message,
    );
    return null;
  }

  if (!data) {
    return null;
  }

  return mapSessionRow(data as unknown as SessionRow);
}
