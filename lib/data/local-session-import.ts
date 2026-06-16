import { saveSessionToSupabase } from "@/lib/data/session-save";
import {
  clearLocalSessions,
  getSessions,
  type ClubSession,
  type SessionInput,
} from "@/lib/sessions";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

export const LOCAL_SESSIONS_IMPORT_COMPLETE_KEY =
  "activora-local-sessions-import-complete";

export type LocalSessionImportResult = {
  imported: number;
  skipped: number;
  failed: Array<{ sessionTitle: string; error: string }>;
};

function clubSessionToSessionInput(session: ClubSession): SessionInput {
  return {
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
}

export function getLocalSessionCount(): number {
  return getSessions().length;
}

export function isLocalSessionImportComplete(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  return (
    localStorage.getItem(LOCAL_SESSIONS_IMPORT_COMPLETE_KEY) === "true"
  );
}

export function shouldShowImportLocalSessionsBanner(): boolean {
  return getLocalSessionCount() > 0 && !isLocalSessionImportComplete();
}

export function dismissLocalSessionImport(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(LOCAL_SESSIONS_IMPORT_COMPLETE_KEY, "true");
}

export function markLocalSessionImportComplete(): void {
  dismissLocalSessionImport();
  clearLocalSessions();
}

export async function importLocalSessionsToSupabase(): Promise<LocalSessionImportResult> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
    );
  }

  const localSessions = getSessions();
  if (localSessions.length === 0) {
    markLocalSessionImportComplete();
    return { imported: 0, skipped: 0, failed: [] };
  }

  const supabase = getSupabaseBrowserClient();
  const { data: existingRows, error: lookupError } = await supabase
    .from("sessions")
    .select("id");

  if (lookupError) {
    throw new Error(
      `Could not check existing Supabase sessions: ${lookupError.message}`,
    );
  }

  const existingIds = new Set((existingRows ?? []).map((row) => row.id));
  const sessionsToImport = localSessions.filter(
    (session) => !existingIds.has(session.id),
  );
  const skipped = localSessions.length - sessionsToImport.length;
  const failed: LocalSessionImportResult["failed"] = [];
  let imported = 0;

  for (const session of sessionsToImport) {
    try {
      await saveSessionToSupabase(
        clubSessionToSessionInput(session),
        session.id,
      );
      imported += 1;
    } catch (error) {
      failed.push({
        sessionTitle: session.sessionTitle,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error during import.",
      });
    }
  }

  if (failed.length === 0) {
    markLocalSessionImportComplete();
  }

  return { imported, skipped, failed };
}
