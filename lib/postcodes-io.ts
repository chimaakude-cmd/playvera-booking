/**
 * UK postcode coordinates via Postcodes.io (fallback when getAddress.io does
 * not return coordinates).
 *
 * Full UK address lists come from getAddress.io in the session wizard.
 * Mapbox is used only for map display and draggable pins.
 */

export class PostcodeLookupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PostcodeLookupError";
  }
}

export const POSTCODE_LOOKUP_FAILED_MESSAGE =
  "We could not find this postcode. Please check it and try again.";

export const POSTCODE_COORDINATES_FAILED_MESSAGE =
  "Could not find postcode coordinates.";

export type UkPostcodeLookupResult = {
  postcode: string;
  latitude: number;
  longitude: number;
  adminDistrict: string;
  parish: string;
};

type PostcodesIoResponse = {
  status: number;
  result?: {
    postcode?: string;
    latitude?: number;
    longitude?: number;
    admin_district?: string;
    parish?: string;
  };
  error?: string;
};

const LOG_PREFIX = "[Activora Postcodes.io]";

export function normalizeUkPostcode(value: string): string {
  return value.replace(/\s+/g, " ").trim().toUpperCase();
}

export function formatUkPostcodeForApi(value: string): string {
  return encodeURIComponent(normalizeUkPostcode(value));
}

export async function lookupUkPostcode(
  postcode: string,
): Promise<UkPostcodeLookupResult> {
  const normalized = normalizeUkPostcode(postcode);

  if (!normalized) {
    throw new PostcodeLookupError(POSTCODE_LOOKUP_FAILED_MESSAGE);
  }

  const response = await fetch(
    `https://api.postcodes.io/postcodes/${formatUkPostcodeForApi(normalized)}`,
  );

  const data = (await response.json()) as PostcodesIoResponse;

  if (!response.ok || data.status !== 200 || !data.result) {
    throw new PostcodeLookupError(
      data.error ?? POSTCODE_LOOKUP_FAILED_MESSAGE,
    );
  }

  const latitude = data.result.latitude;
  const longitude = data.result.longitude;

  if (
    latitude === undefined ||
    longitude === undefined ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    throw new PostcodeLookupError(POSTCODE_LOOKUP_FAILED_MESSAGE);
  }

  const result: UkPostcodeLookupResult = {
    postcode: normalizeUkPostcode(data.result.postcode ?? normalized),
    latitude,
    longitude,
    adminDistrict: data.result.admin_district?.trim() ?? "",
    parish: data.result.parish?.trim() ?? "",
  };

  if (process.env.NODE_ENV === "development") {
    console.log(`${LOG_PREFIX} Postcode validated`, result);
  }

  return result;
}

export function isLikelyUkPostcode(value: string): boolean {
  return /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i.test(value.trim());
}
