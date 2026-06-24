import { formatPostgrestError } from "@/lib/data/supabase-errors";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
  isSupabaseConfigured,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase";

function getSessionWriteClient() {
  return isSupabaseServiceRoleConfigured()
    ? createSupabaseServiceRoleClient()
    : createSupabaseServerClient();
}

export const SESSION_HAS_BOOKINGS_MESSAGE =
  "This session has existing bookings and cannot be permanently deleted.";

export async function getSessionBookingCount(sessionId: string): Promise<number> {
  if (!isSupabaseConfigured()) {
    return 0;
  }

  const supabase = getSessionWriteClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("bookings_count")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    throw new Error(formatPostgrestError("sessions select bookings_count", error));
  }

  return data?.bookings_count ?? 0;
}

export async function hardDeleteSessionById(sessionId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const bookingCount = await getSessionBookingCount(sessionId);
  if (bookingCount > 0) {
    throw new Error(SESSION_HAS_BOOKINGS_MESSAGE);
  }

  const supabase = getSessionWriteClient();
  await supabase.from("session_dates").delete().eq("session_id", sessionId);
  await supabase.from("tickets").delete().eq("session_id", sessionId);

  const { error } = await supabase.from("sessions").delete().eq("id", sessionId);
  if (error) {
    throw new Error(formatPostgrestError("sessions delete", error));
  }
}

export async function archiveSessionById(sessionId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = getSessionWriteClient();
  const { error } = await supabase
    .from("sessions")
    .update({ published: false, updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) {
    throw new Error(formatPostgrestError("sessions archive", error));
  }
}

export async function publishSessionById(sessionId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = getSessionWriteClient();
  const { error } = await supabase
    .from("sessions")
    .update({ published: true, updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) {
    throw new Error(formatPostgrestError("sessions publish", error));
  }
}
