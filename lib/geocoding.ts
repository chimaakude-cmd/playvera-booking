import {
  isLikelyUkPostcode,
  lookupUkPostcode,
  normalizeUkPostcode,
  PostcodeLookupError,
  POSTCODE_LOOKUP_FAILED_MESSAGE,
} from "@/lib/postcodes-io";

export type GeocodeVenueAddressInput = {
  venueName: string;
  addressLine1: string;
  townCity: string;
  postcode: string;
};

export type GeocodingResult = {
  latitude: number;
  longitude: number;
  placeName: string;
  query: string;
};

export class GeocodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeocodingError";
  }
}

export const GEOCODING_FAILED_MESSAGE = POSTCODE_LOOKUP_FAILED_MESSAGE;

const LOG_PREFIX = "[Activora Geocoding]";

/**
 * Mapbox token is used only for interactive map rendering in the session wizard.
 * UK address lists come from getAddress.io; Postcodes.io is the coordinate fallback.
 */
export function getMapboxToken(): string {
  return process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() ?? "";
}

function toGeocodingResult(
  lookup: Awaited<ReturnType<typeof lookupUkPostcode>>,
): GeocodingResult {
  return {
    latitude: lookup.latitude,
    longitude: lookup.longitude,
    placeName: lookup.postcode,
    query: lookup.postcode,
  };
}

function wrapPostcodeError(error: unknown): never {
  if (error instanceof PostcodeLookupError) {
    throw new GeocodingError(error.message);
  }

  throw new GeocodingError(GEOCODING_FAILED_MESSAGE);
}

export async function geocodeUkPostcode(postcode: string): Promise<GeocodingResult> {
  try {
    const lookup = await lookupUkPostcode(postcode);
    const result = toGeocodingResult(lookup);

    if (process.env.NODE_ENV === "development") {
      console.log(`${LOG_PREFIX} UK postcode geocoded via Postcodes.io`, result);
    }

    return result;
  } catch (error) {
    wrapPostcodeError(error);
  }
}

export async function geocodeVenueAddress(
  input: GeocodeVenueAddressInput,
): Promise<GeocodingResult> {
  if (!input.postcode.trim()) {
    throw new GeocodingError(GEOCODING_FAILED_MESSAGE);
  }

  try {
    const lookup = await lookupUkPostcode(input.postcode);
    const result = toGeocodingResult(lookup);

    if (process.env.NODE_ENV === "development") {
      console.log(`${LOG_PREFIX} Venue postcode geocoded via Postcodes.io`, {
        postcode: lookup.postcode,
        latitude: result.latitude,
        longitude: result.longitude,
      });
    }

    return result;
  } catch (error) {
    wrapPostcodeError(error);
  }
}

export async function geocodeSearchQuery(
  locationQuery: string,
): Promise<GeocodingResult> {
  const trimmed = locationQuery.trim();

  if (!trimmed) {
    throw new GeocodingError(GEOCODING_FAILED_MESSAGE);
  }

  if (isLikelyUkPostcode(trimmed)) {
    return geocodeUkPostcode(trimmed);
  }

  throw new GeocodingError(
    "Enter a valid UK postcode to search by location.",
  );
}

export { lookupUkPostcode, normalizeUkPostcode, POSTCODE_LOOKUP_FAILED_MESSAGE };
