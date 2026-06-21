import {
  buildRelatedInsertPayloads,
  buildSessionInsertPayload,
  getSessionImageUrls,
  logSessionSaveContext,
  validateRequiredSessionFields,
} from "@/lib/data/mappers/session-insert";
import { mapSessionRowsToClubSession } from "@/lib/data/mappers/session-mapper";
import { getOrCreateDefaultProviderId } from "@/lib/data/providers/supabase/default-provider";
import {
  formatPostgrestError,
  SupabaseSaveError,
} from "@/lib/data/supabase-errors";
import { hasValidSessionCoordinates } from "@/lib/session-coordinates";
import { VENUE_PIN_REQUIRED_MESSAGE } from "@/lib/session-location";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import type { ClubSession, SessionInput } from "@/lib/sessions";
import type { SessionDateRow, SessionRow, TicketRow } from "@/lib/data/mappers/session-mapper";

function assertSupabaseConfigured(): void {
  if (!isSupabaseConfigured()) {
    throw new SupabaseSaveError(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the dev server.",
    );
  }
}

async function rollbackSession(sessionId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  await supabase.from("session_dates").delete().eq("session_id", sessionId);
  await supabase.from("tickets").delete().eq("session_id", sessionId);
  await supabase.from("sessions").delete().eq("id", sessionId);
}

async function loadSavedSession(sessionId: string): Promise<ClubSession> {
  const supabase = getSupabaseBrowserClient();

  const { data: sessionRow, error: sessionError } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError) {
    throw new SupabaseSaveError(
      formatPostgrestError("Session reload after save", sessionError),
      sessionError,
    );
  }

  if (!sessionRow) {
    throw new SupabaseSaveError(
      "Session insert appeared to succeed but the row could not be reloaded from Supabase.",
    );
  }

  const [{ data: dateRows, error: datesError }, { data: ticketRows, error: ticketsError }] =
    await Promise.all([
      supabase
        .from("session_dates")
        .select("*")
        .eq("session_id", sessionId)
        .order("session_date", { ascending: true }),
      supabase
        .from("tickets")
        .select("*")
        .eq("session_id", sessionId)
        .order("sort_order", { ascending: true }),
    ]);

  if (datesError) {
    throw new SupabaseSaveError(
      formatPostgrestError("Session dates reload after save", datesError),
      datesError,
    );
  }

  if (ticketsError) {
    throw new SupabaseSaveError(
      formatPostgrestError("Tickets reload after save", ticketsError),
      ticketsError,
    );
  }

  return mapSessionRowsToClubSession(
    sessionRow as SessionRow,
    (dateRows ?? []) as SessionDateRow[],
    (ticketRows ?? []) as TicketRow[],
  );
}

export async function saveSessionToSupabase(
  session: Omit<ClubSession, "id" | "bookings" | "createdAt">,
  existingSessionId?: string,
): Promise<ClubSession> {
  assertSupabaseConfigured();

  if (!existingSessionId) {
    const { checkCanCreateActivitySync } = await import(
      "@/lib/subscription-plans/enforcement"
    );
    const { getProviderPlanId } = await import("@/lib/provider-subscription");
    const providerId = await getOrCreateDefaultProviderId();
    const { count } = await getSupabaseBrowserClient()
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("provider_id", providerId);

    const gate = checkCanCreateActivitySync(getProviderPlanId(), count ?? 0);
    if (!gate.allowed) {
      throw new SupabaseSaveError(
        "Activity limit reached on your current plan. Upgrade to Pro for unlimited activities.",
      );
    }
  }

  const missingFields = validateRequiredSessionFields(session);
  if (missingFields.length > 0) {
    throw new SupabaseSaveError(
      `Missing required session fields before Supabase insert: ${missingFields.join(", ")}`,
    );
  }

  if (!session.venue || !hasValidSessionCoordinates(session as ClubSession)) {
    throw new SupabaseSaveError(VENUE_PIN_REQUIRED_MESSAGE);
  }

  const supabase = getSupabaseBrowserClient();
  const providerId = await getOrCreateDefaultProviderId();
  const sessionId = existingSessionId ?? crypto.randomUUID();
  const sessionRow = buildSessionInsertPayload(session, providerId, sessionId);
  const imageUrls = getSessionImageUrls(session);
  const { dateRows, ticketRows } = buildRelatedInsertPayloads(sessionId, session);

  logSessionSaveContext("Session insert payload", {
    sessionPayload: sessionRow,
    imageUrls,
    sessionDatesPayload: dateRows,
    ticketsPayload: ticketRows,
    providerId,
    confirmedCoordinates: {
      latitude: session.venue.latitude,
      longitude: session.venue.longitude,
    },
  });

  const { data: insertedSession, error: sessionError } = await supabase
    .from("sessions")
    .insert(sessionRow)
    .select("*")
    .single();

  console.log("[Activora Supabase] Sessions insert response", {
    data: insertedSession,
    error: sessionError,
  });

  if (sessionError) {
    console.error("[Activora Supabase] Sessions insert error", sessionError);
    throw new SupabaseSaveError(
      formatPostgrestError("sessions insert", sessionError),
      sessionError,
    );
  }

  if (dateRows.length > 0) {
    const { data: insertedDates, error: datesError } = await supabase
      .from("session_dates")
      .insert(dateRows)
      .select("*");

    console.log("[Activora Supabase] session_dates insert response", {
      data: insertedDates,
      error: datesError,
    });

    if (datesError) {
      console.error("[Activora Supabase] session_dates insert error", datesError);
      await rollbackSession(sessionId);
      throw new SupabaseSaveError(
        formatPostgrestError("session_dates insert", datesError),
        datesError,
      );
    }
  }

  if (ticketRows.length > 0) {
    const { data: insertedTickets, error: ticketsError } = await supabase
      .from("tickets")
      .insert(ticketRows)
      .select("*");

    console.log("[Activora Supabase] tickets insert response", {
      data: insertedTickets,
      error: ticketsError,
    });

    if (ticketsError) {
      console.error("[Activora Supabase] tickets insert error", ticketsError);
      await rollbackSession(sessionId);
      throw new SupabaseSaveError(
        formatPostgrestError("tickets insert", ticketsError),
        ticketsError,
      );
    }
  }

  const saved = await loadSavedSession(sessionId);

  console.log("[Activora Supabase] Session save complete", {
    sessionId: saved.id,
    imageUrls,
  });

  return saved;
}

export async function retrySessionSupabaseSave(
  session: ClubSession,
): Promise<ClubSession> {
  const sessionInput: SessionInput = {
    sessionTitle: session.sessionTitle,
    activityType: session.activityType,
    location: session.location,
    day: session.day,
    startTime: session.startTime,
    endTime: session.endTime,
    price: session.price,
    capacity: session.capacity,
    ageRange: session.ageRange,
    providerStripeAccountId: session.providerStripeAccountId,
    platformFeePercent: session.platformFeePercent,
    description: session.description,
    bookingStructure: session.bookingStructure,
    details: session.details,
    schedule: session.schedule,
    defaultCapacity: session.defaultCapacity,
    tickets: session.tickets,
    confirmationEmail: session.confirmationEmail,
    ticketSummaryPrimaryId: session.ticketSummaryPrimaryId,
    minSessionCapacity: session.minSessionCapacity,
    maxSessionCapacity: session.maxSessionCapacity,
    published: session.published ?? true,
    venue: session.venue,
  };

  return saveSessionToSupabase(sessionInput, session.id);
}
