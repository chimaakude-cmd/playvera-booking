import { normalizeUkPostcode } from "@/lib/postcodes-io";

export { POSTCODE_COORDINATES_FAILED_MESSAGE } from "@/lib/postcodes-io";

export class GetAddressLookupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GetAddressLookupError";
  }
}

export const GETADDRESS_NOT_CONFIGURED_MESSAGE =
  "Address lookup is not configured. Add NEXT_PUBLIC_GETADDRESS_API_KEY.";

export const GETADDRESS_NO_ADDRESSES_MESSAGE =
  "We couldn't find addresses for this postcode. Please enter the address manually.";

export type UkAddressOption = {
  id: string;
  venueName: string;
  addressLine1: string;
  addressLine2: string;
  townCity: string;
  postcode: string;
  latitude: number | null;
  longitude: number | null;
};

export type UkAddressLookupResult = {
  postcode: string;
  latitude: number;
  longitude: number;
  addresses: UkAddressOption[];
};

export type GetAddressExpandedAddress = {
  formatted_address?: string[];
  thoroughfare?: string;
  building_name?: string;
  sub_building_name?: string;
  building_number?: string;
  line_1?: string;
  line_2?: string;
  line_3?: string;
  line_4?: string;
  locality?: string;
  town_or_city?: string;
  county?: string;
  district?: string;
  country?: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
};

export type GetAddressFindResponse = {
  postcode?: string;
  latitude?: number;
  longitude?: number;
  addresses?: Array<GetAddressExpandedAddress | string>;
};

export function getGetAddressApiKey(): string {
  return process.env.NEXT_PUBLIC_GETADDRESS_API_KEY?.trim() ?? "";
}

function buildVenueName(address: GetAddressExpandedAddress): string {
  return (
    address.building_name?.trim() ||
    address.sub_building_name?.trim() ||
    ""
  );
}

function buildAddressLine1(address: GetAddressExpandedAddress): string {
  const line1 = address.line_1?.trim();
  if (line1) {
    return line1;
  }

  return [address.building_number?.trim(), address.thoroughfare?.trim()]
    .filter(Boolean)
    .join(" ");
}

function buildAddressLine2(
  address: GetAddressExpandedAddress,
  venueName: string,
): string {
  const line2 = address.line_2?.trim();
  if (line2) {
    return line2;
  }

  const line3 = address.line_3?.trim();
  if (line3) {
    return line3;
  }

  const subBuilding = address.sub_building_name?.trim() ?? "";
  if (subBuilding && subBuilding !== venueName) {
    return subBuilding;
  }

  return "";
}

function buildTownCity(address: GetAddressExpandedAddress): string {
  return (
    address.town_or_city?.trim() ||
    address.locality?.trim() ||
    address.district?.trim() ||
    address.county?.trim() ||
    ""
  );
}

function hasValidCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): boolean {
  return (
    latitude !== null &&
    latitude !== undefined &&
    longitude !== null &&
    longitude !== undefined &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  );
}

export function mapExpandedAddress(
  address: GetAddressExpandedAddress,
  index: number,
  postcode: string,
  fallbackCoordinates: { latitude: number; longitude: number },
): UkAddressOption {
  const venueName = buildVenueName(address);
  const addressLine1 = buildAddressLine1(address);

  const latitude = hasValidCoordinates(address.latitude, address.longitude)
    ? (address.latitude as number)
    : fallbackCoordinates.latitude;
  const longitude = hasValidCoordinates(address.latitude, address.longitude)
    ? (address.longitude as number)
    : fallbackCoordinates.longitude;

  return {
    id: `${normalizeUkPostcode(postcode)}-${index}`,
    venueName,
    addressLine1,
    addressLine2: buildAddressLine2(address, venueName),
    townCity: buildTownCity(address),
    postcode: normalizeUkPostcode(postcode),
    latitude,
    longitude,
  };
}

export async function lookupUkAddressesByPostcode(
  postcode: string,
): Promise<UkAddressLookupResult> {
  const normalizedPostcode = normalizeUkPostcode(postcode);

  if (!normalizedPostcode) {
    throw new GetAddressLookupError(GETADDRESS_NO_ADDRESSES_MESSAGE);
  }

  const response = await fetch(
    `/api/addresses/${encodeURIComponent(normalizedPostcode)}`,
  );
  const text = await response.text();

  if (!text) {
    throw new GetAddressLookupError(GETADDRESS_NO_ADDRESSES_MESSAGE);
  }

  let data: UkAddressLookupResult | { error?: string };

  try {
    data = JSON.parse(text) as UkAddressLookupResult | { error?: string };
  } catch {
    throw new GetAddressLookupError(GETADDRESS_NO_ADDRESSES_MESSAGE);
  }

  if (!response.ok) {
    const message =
      "error" in data && data.error === GETADDRESS_NOT_CONFIGURED_MESSAGE
        ? GETADDRESS_NOT_CONFIGURED_MESSAGE
        : GETADDRESS_NO_ADDRESSES_MESSAGE;
    throw new GetAddressLookupError(message);
  }

  if (!("addresses" in data) || !Array.isArray(data.addresses)) {
    throw new GetAddressLookupError(GETADDRESS_NO_ADDRESSES_MESSAGE);
  }

  if (data.addresses.length === 0) {
    throw new GetAddressLookupError(GETADDRESS_NO_ADDRESSES_MESSAGE);
  }

  return data;
}
