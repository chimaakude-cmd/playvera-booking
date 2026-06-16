import type { ClubSession } from "@/lib/sessions";

export const LONDON_CENTER = {
  lng: -0.1276,
  lat: 51.5074,
};

export type SessionCoordinates = {
  lng: number;
  lat: number;
};

export type MapCoordinateSource =
  | "stored"
  | "postcode_placeholder"
  | "session_id_placeholder";

export type MapDisplayCoordinates = SessionCoordinates & {
  source: MapCoordinateSource;
};

const UK_POSTCODE_PATTERN = /\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i;

export function getPostcodePlaceholderCoordinates(
  postcode: string,
): SessionCoordinates {
  const normalized = postcode.replace(/\s+/g, "").toUpperCase();
  let hash = 0;

  for (let index = 0; index < normalized.length; index += 1) {
    hash = normalized.charCodeAt(index) + ((hash << 5) - hash);
  }

  const lngOffset = ((hash % 200) - 100) / 600;
  const latOffset = (((hash >> 8) % 200) - 100) / 600;

  return {
    lng: LONDON_CENTER.lng + lngOffset,
    lat: LONDON_CENTER.lat + latOffset,
  };
}

function getLegacySessionCoordinates(sessionId: string): SessionCoordinates {
  let hash = 0;

  for (let index = 0; index < sessionId.length; index += 1) {
    hash = sessionId.charCodeAt(index) + ((hash << 5) - hash);
  }

  const lngOffset = ((hash % 240) - 120) / 800;
  const latOffset = (((hash >> 8) % 240) - 120) / 800;

  return {
    lng: LONDON_CENTER.lng + lngOffset,
    lat: LONDON_CENTER.lat + latOffset,
  };
}

export function extractPostcodeFromText(value: string): string | null {
  const match = value.match(UK_POSTCODE_PATTERN);
  if (!match?.[1]) {
    return null;
  }

  return match[1].replace(/\s+/g, " ").trim().toUpperCase();
}

export function getSessionPostcode(session: ClubSession): string | null {
  const venuePostcode = session.venue?.postcode?.trim();
  if (venuePostcode) {
    return venuePostcode.toUpperCase();
  }

  if (session.location) {
    return extractPostcodeFromText(session.location);
  }

  return null;
}

export function hasValidSessionCoordinates(session: ClubSession): boolean {
  const latitude = session.venue?.latitude;
  const longitude = session.venue?.longitude;

  return (
    latitude !== null &&
    latitude !== undefined &&
    longitude !== null &&
    longitude !== undefined &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  );
}

function hasStoredCoordinates(session: ClubSession): boolean {
  return hasValidSessionCoordinates(session);
}

/** Returns geocoded coordinates stored on the session, or null if missing. */
export function getStoredSessionCoordinates(
  session: ClubSession,
): SessionCoordinates | null {
  if (!hasStoredCoordinates(session)) {
    return null;
  }

  return {
    lat: session.venue!.latitude as number,
    lng: session.venue!.longitude as number,
  };
}

/** Map-only coordinates. Placeholder values are not real geocoded positions. */
export function getMapDisplayCoordinates(
  session: ClubSession,
): MapDisplayCoordinates | null {
  if (hasStoredCoordinates(session)) {
    return {
      lat: session.venue!.latitude as number,
      lng: session.venue!.longitude as number,
      source: "stored",
    };
  }

  return null;
}

export function getSessionCoordinates(session: ClubSession): SessionCoordinates | null {
  return getStoredSessionCoordinates(session);
}

export function getSearchCenterCoordinates(locationQuery: string): SessionCoordinates {
  const trimmed = locationQuery.trim();
  if (!trimmed) {
    return LONDON_CENTER;
  }

  const postcode = extractPostcodeFromText(trimmed);
  if (postcode) {
    return getPostcodePlaceholderCoordinates(postcode);
  }

  return getPostcodePlaceholderCoordinates(trimmed);
}

export function getDistanceMiles(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const latDelta = toRadians(toLat - fromLat);
  const lngDelta = toRadians(toLng - fromLng);
  const fromLatRad = toRadians(fromLat);
  const toLatRad = toRadians(toLat);

  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(fromLatRad) * Math.cos(toLatRad) * Math.sin(lngDelta / 2) ** 2;

  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getSessionDistanceMiles(
  session: ClubSession,
  searchLocation = "",
  searchCenter?: SessionCoordinates | null,
): number | null {
  const coordinates = getStoredSessionCoordinates(session);
  if (!coordinates) {
    return null;
  }

  const center =
    searchCenter ??
    (searchLocation.trim()
      ? getSearchCenterCoordinates(searchLocation)
      : LONDON_CENTER);

  return getDistanceMiles(
    center.lat,
    center.lng,
    coordinates.lat,
    coordinates.lng,
  );
}

/** @deprecated Pass the full session object instead. */
export function getSessionCoordinatesById(sessionId: string): SessionCoordinates {
  return getLegacySessionCoordinates(sessionId);
}

/** @deprecated Pass the full session object instead. */
export function getSessionDistanceMilesById(sessionId: string): number {
  const coordinates = getLegacySessionCoordinates(sessionId);
  return getDistanceMiles(
    LONDON_CENTER.lat,
    LONDON_CENTER.lng,
    coordinates.lat,
    coordinates.lng,
  );
}
