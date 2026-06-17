import type {
  ActivityStatus,
  ActivityVisibility,
  AdminActivity,
} from "@/lib/admin/types";
import { adminListDataSource } from "@/lib/admin/data-source";
import { isDemoProviderRecord } from "@/lib/data/providers/supabase/default-provider";
import { formatDay } from "@/lib/sessions";
import { DEMO_PROVIDER_ID } from "@/lib/stripe-connect/types";
import { createSupabaseServerClient } from "@/lib/supabase";

export const ACTIVITY_REMOVAL_REASONS = [
  { value: "false_listing", label: "False listing" },
  { value: "inappropriate_listing", label: "Inappropriate listing" },
  { value: "duplicate_listing", label: "Duplicate listing" },
  { value: "safety_concern", label: "Safety concern" },
  { value: "other", label: "Other" },
] as const;

export type ActivityRemovalReason =
  (typeof ACTIVITY_REMOVAL_REASONS)[number]["value"];

const ACTIVITY_REMOVAL_REASON_SET = new Set<string>(
  ACTIVITY_REMOVAL_REASONS.map((reason) => reason.value),
);

export function parseActivityRemovalReason(
  value: unknown,
): ActivityRemovalReason | null {
  if (typeof value === "string" && ACTIVITY_REMOVAL_REASON_SET.has(value)) {
    return value as ActivityRemovalReason;
  }

  return null;
}

export function getActivityRemovalReasonLabel(
  reason: ActivityRemovalReason,
): string {
  return (
    ACTIVITY_REMOVAL_REASONS.find((entry) => entry.value === reason)?.label ??
    reason
  );
}

export type ProviderRemovalContact = {
  email: string;
  providerName: string;
};

export type AdminActivitiesListResult = {
  activities: AdminActivity[];
  dataSource: "supabase" | "env_missing";
};

export type AdminActivityProviderOption = {
  id: string;
  name: string;
};

export type AdminActivityUpdatePayload = {
  title?: string;
  providerId?: string;
  day?: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  capacity?: number;
  price?: number;
  status?: "draft" | "published" | "unpublished";
  visibility?: ActivityVisibility;
};

type ScheduleConfig = {
  admin_status?: ActivityStatus;
  visibility?: ActivityVisibility;
  [key: string]: unknown;
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
  schedule_config: ScheduleConfig | null;
  created_at: string;
  moderation_status?: "active" | "removed" | null;
  providers:
    | { name: string; slug?: string | null }
    | { name: string; slug?: string | null }[]
    | null;
};

function isDemoActivityRow(row: SessionRow): boolean {
  const provider = firstRelation(row.providers);

  return (
    row.provider_id === DEMO_PROVIDER_ID ||
    isDemoProviderRecord({
      id: row.provider_id,
      name: provider?.name,
      slug: provider?.slug,
    })
  );
}

function isRemovedActivityRow(row: SessionRow): boolean {
  return row.moderation_status === "removed";
}

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

function normalizeTimeForDb(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "00:00";
  }

  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) {
    return trimmed;
  }

  const hours = match[1].padStart(2, "0");
  const minutes = match[2];
  return `${hours}:${minutes}`;
}

function parseScheduleConfig(value: unknown): ScheduleConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as ScheduleConfig;
}

function deriveStatus(
  published: boolean,
  scheduleConfig: ScheduleConfig,
): ActivityStatus {
  if (scheduleConfig.admin_status === "unpublished") {
    return "unpublished";
  }

  if (scheduleConfig.admin_status === "draft") {
    return "draft";
  }

  if (scheduleConfig.admin_status === "published") {
    return "published";
  }

  return published ? "published" : "draft";
}

function deriveVisibility(
  published: boolean,
  scheduleConfig: ScheduleConfig,
): ActivityVisibility {
  if (scheduleConfig.visibility === "hidden") {
    return "hidden";
  }

  if (scheduleConfig.visibility === "public") {
    return "public";
  }

  return published ? "public" : "hidden";
}

function mapSessionRow(row: SessionRow): AdminActivity {
  const provider = firstRelation(row.providers);
  const scheduleConfig = parseScheduleConfig(row.schedule_config);
  const dayRaw = row.day?.trim().toLowerCase() || "monday";

  return {
    id: row.id,
    title: row.session_title.trim() || "Untitled activity",
    providerId: row.provider_id,
    providerName: provider?.name.trim() || "—",
    venue: row.venue_name.trim() || row.location.trim() || "—",
    day: dayRaw ? formatDay(dayRaw) : "—",
    dayRaw,
    startTime: formatTime(row.start_time),
    endTime: formatTime(row.end_time),
    capacity: Number(row.capacity ?? 0),
    bookingsCount: Number(row.bookings_count ?? 0),
    price: Number(row.price ?? 0),
    status: deriveStatus(Boolean(row.published), scheduleConfig),
    visibility: deriveVisibility(Boolean(row.published), scheduleConfig),
    createdAt: row.created_at,
  };
}

const SESSION_SELECT = `
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
  schedule_config,
  moderation_status,
  created_at,
  providers (
    name,
    slug
  )
`;

async function fetchSessionRows(): Promise<SessionRow[] | null> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("sessions")
    .select(SESSION_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Admin activities] Failed to load sessions:", error.message);
    return null;
  }

  return (data ?? [])
    .filter(
      (row) =>
        !isRemovedActivityRow(row as SessionRow) &&
        !isDemoActivityRow(row as SessionRow),
    ) as unknown as SessionRow[];
}

export async function fetchAdminActivityProviders(): Promise<
  AdminActivityProviderOption[]
> {
  if (adminListDataSource() === "env_missing") {
    return [];
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("providers")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (error) {
    console.error("[Admin activities] Failed to load providers:", error.message);
    return [];
  }

  return (data ?? [])
    .filter(
      (row) =>
        row.id !== DEMO_PROVIDER_ID &&
        !isDemoProviderRecord({
          id: row.id,
          name: row.name,
          slug: row.slug,
        }),
    )
    .map((row) => ({
      id: row.id,
      name: row.name?.trim() || "Unnamed provider",
    }));
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
  if (adminListDataSource() === "env_missing") {
    return null;
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("sessions")
    .select(SESSION_SELECT)
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

export async function updateAdminActivity(
  id: string,
  payload: AdminActivityUpdatePayload,
): Promise<{ ok: true; activity: AdminActivity } | { ok: false; error: string }> {
  if (adminListDataSource() === "env_missing") {
    return { ok: false, error: "Supabase is not configured." };
  }

  const existing = await fetchAdminActivityById(id);
  if (!existing) {
    return { ok: false, error: "Activity not found." };
  }

  const supabase = createSupabaseServerClient();

  const { data: existingRow, error: existingError } = await supabase
    .from("sessions")
    .select("schedule_config")
    .eq("id", id)
    .maybeSingle();

  if (existingError || !existingRow) {
    return { ok: false, error: "Activity not found." };
  }

  const scheduleConfig = parseScheduleConfig(existingRow.schedule_config);
  const nextStatus = payload.status ?? existing.status;
  const nextVisibility = payload.visibility ?? existing.visibility;

  const published =
    nextStatus === "published" && nextVisibility === "public";

  const nextScheduleConfig: ScheduleConfig = {
    ...scheduleConfig,
    admin_status: nextStatus,
    visibility: nextVisibility,
  };

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    published,
    schedule_config: nextScheduleConfig,
  };

  if (payload.title !== undefined) {
    updates.session_title = payload.title.trim();
  }

  if (payload.providerId !== undefined) {
    updates.provider_id = payload.providerId;
  }

  if (payload.day !== undefined) {
    updates.day = payload.day.trim().toLowerCase();
  }

  if (payload.startTime !== undefined) {
    updates.start_time = normalizeTimeForDb(payload.startTime);
  }

  if (payload.endTime !== undefined) {
    updates.end_time = normalizeTimeForDb(payload.endTime);
  }

  if (payload.venue !== undefined) {
    updates.venue_name = payload.venue.trim();
    updates.location = payload.venue.trim();
  }

  if (payload.capacity !== undefined) {
    updates.capacity = payload.capacity;
    updates.default_capacity = payload.capacity;
  }

  if (payload.price !== undefined) {
    updates.price = payload.price;
  }

  const { error: updateError } = await supabase
    .from("sessions")
    .update(updates)
    .eq("id", id);

  if (updateError) {
    console.error("[Admin activities] Failed to update session:", updateError.message);
    return { ok: false, error: updateError.message };
  }

  const sessionDateUpdates: Record<string, unknown> = {};
  if (payload.startTime !== undefined) {
    sessionDateUpdates.start_time = normalizeTimeForDb(payload.startTime);
  }
  if (payload.endTime !== undefined) {
    sessionDateUpdates.end_time = normalizeTimeForDb(payload.endTime);
  }
  if (payload.capacity !== undefined) {
    sessionDateUpdates.capacity = payload.capacity;
  }

  if (Object.keys(sessionDateUpdates).length > 0) {
    const { error: datesError } = await supabase
      .from("session_dates")
      .update(sessionDateUpdates)
      .eq("session_id", id);

    if (datesError) {
      console.error(
        "[Admin activities] Failed to sync session_dates:",
        datesError.message,
      );
      return { ok: false, error: datesError.message };
    }
  }

  const activity = await fetchAdminActivityById(id);
  if (!activity) {
    return { ok: false, error: "Activity could not be reloaded after update." };
  }

  return { ok: true, activity };
}

export async function deleteAdminActivity(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (adminListDataSource() === "env_missing") {
    return { ok: false, error: "Supabase is not configured." };
  }

  const supabase = createSupabaseServerClient();

  const { error } = await supabase.from("sessions").delete().eq("id", id);

  if (error) {
    console.error("[Admin activities] Failed to delete session:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function fetchProviderRemovalContact(
  providerId: string,
): Promise<ProviderRemovalContact | null> {
  if (adminListDataSource() === "env_missing") {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("providers")
    .select(
      `
      id,
      name,
      email,
      club_profiles (
        club_name,
        email
      ),
      club_team_members (
        email,
        first_name,
        last_name,
        is_owner,
        status
      )
    `,
    )
    .eq("id", providerId)
    .maybeSingle();

  if (error) {
    console.error(
      "[Admin activities] Failed to load provider contact:",
      error.message,
    );
    return null;
  }

  if (!data) {
    return null;
  }

  const profile = firstRelation(
    data.club_profiles as
      | { club_name: string; email: string | null }
      | { club_name: string; email: string | null }[]
      | null,
  );
  const members = (data.club_team_members ?? []) as Array<{
    email: string;
    first_name: string;
    last_name: string;
    is_owner: boolean;
    status: string;
  }>;
  const owner = members.find(
    (member) => member.is_owner && member.status === "active",
  );

  const email =
    owner?.email?.trim() ||
    data.email?.trim() ||
    profile?.email?.trim() ||
    null;

  if (!email) {
    return null;
  }

  const ownerName = owner
    ? `${owner.first_name} ${owner.last_name}`.trim()
    : "";
  const providerName =
    ownerName || profile?.club_name?.trim() || data.name?.trim() || "Provider";

  return { email, providerName };
}

export async function removeAdminActivity(
  id: string,
  input: {
    removalReason: ActivityRemovalReason;
    removalNotes?: string | null;
    actorId: string;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (adminListDataSource() === "env_missing") {
    return { ok: false, error: "Supabase is not configured." };
  }

  const existing = await fetchAdminActivityById(id);
  if (!existing) {
    return { ok: false, error: "Activity not found." };
  }

  const supabase = createSupabaseServerClient();
  const removedAt = new Date().toISOString();

  const notes = input.removalNotes?.trim() || null;

  const { error } = await supabase
    .from("sessions")
    .update({
      moderation_status: "removed",
      removal_reason: input.removalReason,
      removal_notes: notes,
      removed_at: removedAt,
      removed_by: input.actorId,
      published: false,
      updated_at: removedAt,
    })
    .eq("id", id);

  if (error) {
    console.error("[Admin activities] Failed to remove session:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
