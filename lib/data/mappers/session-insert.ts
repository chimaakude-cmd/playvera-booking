import type { Json } from "@/lib/database.types";
import type { ClubSession } from "@/lib/sessions";
import {
  mapClubSessionDatesToInsert,
  mapClubSessionTicketsToInsert,
  toDbTime,
} from "@/lib/data/mappers/session-mapper";
import { buildSessionLocationLabel } from "@/lib/session-location";
import { hasValidSessionCoordinates } from "@/lib/session-coordinates";

const LOG_PREFIX = "[Activora Supabase]";

export function logSessionSaveContext(
  label: string,
  payload: Record<string, unknown>,
): void {
  console.group(`${LOG_PREFIX} ${label}`);
  console.log(payload);
  console.groupEnd();
}

export function validateRequiredSessionFields(
  session: Omit<ClubSession, "id" | "bookings" | "createdAt">,
): string[] {
  const missing: string[] = [];

  if (!session.sessionTitle?.trim()) {
    missing.push("session_title");
  }

  if (!session.description?.trim() && !session.details?.description?.trim()) {
    missing.push("description");
  }

  if (!session.activityType?.trim()) {
    missing.push("activity_type");
  }

  if (!session.venue?.venueName?.trim()) {
    missing.push("venue_name");
  }

  if (!session.venue?.addressLine1?.trim()) {
    missing.push("address_line_1");
  }

  if (!session.venue?.townCity?.trim()) {
    missing.push("town_city");
  }

  if (!session.venue?.postcode?.trim()) {
    missing.push("postcode");
  }

  if (!session.providerVenueId) {
    missing.push("provider_venue_id");
  }

  if (!hasValidSessionCoordinates(session as ClubSession)) {
    missing.push("latitude");
    missing.push("longitude");
  }

  return missing;
}

export function buildSessionInsertPayload(
  session: Omit<ClubSession, "id" | "bookings" | "createdAt">,
  providerId: string,
  sessionId: string,
) {
  const images = session.details?.images ?? {
    mainImage: null,
    extraImages: [],
  };
  const venue = session.venue;

  const required = {
    id: sessionId,
    provider_id: providerId,
    session_title: session.sessionTitle.trim(),
    description: (session.description ?? session.details?.description ?? "").trim(),
    activity_type: session.activityType.trim(),
    venue_name: venue?.venueName?.trim() ?? "",
    address_line_1: venue?.addressLine1?.trim() ?? "",
    town_city: venue?.townCity?.trim() ?? "",
    postcode: venue?.postcode?.trim().toUpperCase() ?? "",
  };

  const optional: Record<string, Json | string | number | boolean | null> = {};

  if (venue?.addressLine2?.trim()) {
    optional.address_line_2 = venue.addressLine2.trim();
  }

  if (venue?.locationNotes?.trim()) {
    optional.location_notes = venue.locationNotes.trim();
  }

  if (venue?.latitude != null && venue?.longitude != null) {
    optional.latitude = venue.latitude;
    optional.longitude = venue.longitude;
  }

  if (session.providerVenueId) {
    optional.provider_venue_id = session.providerVenueId;
  }

  if (venue) {
    optional.location = buildSessionLocationLabel(venue);
  } else if (session.location?.trim()) {
    optional.location = session.location.trim();
  }

  const ageRange = session.ageRange || session.details?.ageGroup;
  if (ageRange?.trim()) {
    optional.age_range = ageRange.trim();
  }

  if (session.bookingStructure) {
    optional.booking_type = session.bookingStructure;
  }

  if (session.details?.attendeeCriteria) {
    optional.attendee_criteria = session.details.attendeeCriteria as Json;
  }

  if (session.schedule) {
    const { dates: _dates, ...scheduleConfig } = session.schedule;
    optional.schedule_config = scheduleConfig as Json;
  }

  optional.images = images as Json;

  if (session.details?.parentsBring?.trim()) {
    optional.parents_bring = session.details.parentsBring.trim();
  }

  if (session.details?.clubProvides?.trim()) {
    optional.club_provides = session.details.clubProvides.trim();
  }

  if (session.confirmationEmail) {
    optional.confirmation_email = session.confirmationEmail as Json;
  }

  optional.default_capacity = session.defaultCapacity ?? session.capacity;
  optional.day = session.day;
  optional.start_time = toDbTime(session.startTime);
  optional.end_time = toDbTime(session.endTime);
  optional.price = session.price;
  optional.capacity = session.capacity;
  optional.platform_fee_percent = session.platformFeePercent;
  optional.bookings_count = 0;
  optional.published = session.published ?? true;

  return { ...required, ...optional };
}

export function getSessionImageUrls(
  session: Omit<ClubSession, "id" | "bookings" | "createdAt">,
) {
  const images = session.details?.images;
  return {
    mainImage: images?.mainImage ?? null,
    extraImages: images?.extraImages ?? [],
  };
}

export function buildRelatedInsertPayloads(
  sessionId: string,
  session: Omit<ClubSession, "id" | "bookings" | "createdAt">,
) {
  return {
    dateRows: mapClubSessionDatesToInsert(
      sessionId,
      session.schedule?.dates ?? [],
    ),
    ticketRows: mapClubSessionTicketsToInsert(sessionId, session.tickets),
  };
}

export type SessionDateInsertRow = ReturnType<
  typeof mapClubSessionDatesToInsert
>[number];

export type SessionTicketInsertRow = ReturnType<
  typeof mapClubSessionTicketsToInsert
>[number];

export type SessionInsertPayload = ReturnType<typeof buildSessionInsertPayload>;
