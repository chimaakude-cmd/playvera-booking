import {
  GEOCODING_FAILED_MESSAGE,
  GeocodingError,
  geocodeVenueAddress,
  type GeocodingResult,
} from "@/lib/geocoding";
import { SupabaseSaveError } from "@/lib/data/supabase-errors";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import type { ClubSession } from "@/lib/sessions";
import { hasValidSessionCoordinates } from "@/lib/session-coordinates";

export { GEOCODING_FAILED_MESSAGE };

export type SessionLocationRepairResult = {
  fixed: number;
  failed: Array<{ sessionId: string; sessionTitle: string; error: string }>;
  skipped: number;
};

export async function geocodeSessionVenue<
  T extends Omit<ClubSession, "id" | "bookings" | "createdAt">,
>(session: T): Promise<T> {
  const venue = session.venue;

  if (!venue) {
    throw new SupabaseSaveError(GEOCODING_FAILED_MESSAGE);
  }

  try {
    const result = await geocodeVenueAddress({
      venueName: venue.venueName,
      addressLine1: venue.addressLine1,
      townCity: venue.townCity,
      postcode: venue.postcode,
    });

    return {
      ...session,
      venue: {
        ...venue,
        latitude: result.latitude,
        longitude: result.longitude,
      },
    };
  } catch (error) {
    if (error instanceof GeocodingError) {
      throw new SupabaseSaveError(error.message, error);
    }

    throw new SupabaseSaveError(GEOCODING_FAILED_MESSAGE, error);
  }
}

export async function updateSessionCoordinatesInSupabase(
  sessionId: string,
  coordinates: Pick<GeocodingResult, "latitude" | "longitude">,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("sessions")
    .update({
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    })
    .eq("id", sessionId);

  if (error) {
    throw new Error(`Could not update session coordinates: ${error.message}`);
  }
}

export async function repairMissingSessionCoordinates(
  sessions: ClubSession[],
): Promise<SessionLocationRepairResult> {
  const missing = sessions.filter((session) => !hasValidSessionCoordinates(session));
  let fixed = 0;
  const skipped = sessions.length - missing.length;
  const failed: SessionLocationRepairResult["failed"] = [];

  for (const session of missing) {
    if (!session.venue?.postcode?.trim()) {
      failed.push({
        sessionId: session.id,
        sessionTitle: session.sessionTitle,
        error: "Missing venue postcode in Supabase.",
      });
      continue;
    }

    try {
      const geocodedSession = await geocodeSessionVenue({
        ...session,
        venue: session.venue,
      });

      await updateSessionCoordinatesInSupabase(session.id, {
        latitude: geocodedSession.venue!.latitude as number,
        longitude: geocodedSession.venue!.longitude as number,
      });

      fixed += 1;
    } catch (error) {
      failed.push({
        sessionId: session.id,
        sessionTitle: session.sessionTitle,
        error:
          error instanceof Error
            ? error.message
            : GEOCODING_FAILED_MESSAGE,
      });
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[Activora Geocoding] Repair complete", {
      fixed,
      failed: failed.length,
      skipped,
    });
  }

  return { fixed, failed, skipped };
}

export function getSessionsMissingCoordinates(
  sessions: ClubSession[],
): ClubSession[] {
  return sessions.filter((session) => !hasValidSessionCoordinates(session));
}
