import {
  lookupUkPostcode,
  normalizeUkPostcode,
  PostcodeLookupError,
  POSTCODE_COORDINATES_FAILED_MESSAGE,
} from "@/lib/postcodes-io";
import {
  GetAddressLookupError,
  GETADDRESS_NOT_CONFIGURED_MESSAGE,
  GETADDRESS_NO_ADDRESSES_MESSAGE,
  mapExpandedAddress,
  type GetAddressExpandedAddress,
  type GetAddressFindResponse,
  type UkAddressLookupResult,
} from "@/lib/getaddress-io";

const LOG_PREFIX = "[Activora getAddress.io]";
const GETADDRESS_API_BASE = "https://api.getAddress.io";
const MAX_ADDRESS_SUGGESTIONS = 40;

type GetAddressAutocompleteResponse = {
  suggestions?: Array<{
    address: string;
    url: string;
    id: string;
  }>;
};

type SafeFetchResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  text: string;
};

function getGetAddressApiKey(): string {
  return (
    process.env.GETADDRESS_API_KEY?.trim() ??
    process.env.NEXT_PUBLIC_GETADDRESS_API_KEY?.trim() ??
    ""
  );
}

function formatPostcodeForGetAddressPath(postcode: string): string {
  return normalizeUkPostcode(postcode).replace(/\s+/g, "").toLowerCase();
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

async function resolvePostcodeCoordinates(
  postcode: string,
  preferred?: { latitude?: number; longitude?: number },
): Promise<{ latitude: number; longitude: number; postcode: string }> {
  if (
    preferred &&
    hasValidCoordinates(preferred.latitude, preferred.longitude)
  ) {
    return {
      postcode: normalizeUkPostcode(postcode),
      latitude: preferred.latitude!,
      longitude: preferred.longitude!,
    };
  }

  try {
    const lookup = await lookupUkPostcode(postcode);
    return {
      postcode: lookup.postcode,
      latitude: lookup.latitude,
      longitude: lookup.longitude,
    };
  } catch (error) {
    if (error instanceof PostcodeLookupError) {
      throw new GetAddressLookupError(POSTCODE_COORDINATES_FAILED_MESSAGE);
    }

    throw error;
  }
}

async function safeFetchJson<T>(
  url: string,
  init?: RequestInit,
): Promise<SafeFetchResult<T>> {
  const response = await fetch(url, init);
  const text = await response.text();

  if (!text) {
    return {
      ok: response.ok,
      status: response.status,
      data: null,
      text,
    };
  }

  try {
    return {
      ok: response.ok,
      status: response.status,
      data: JSON.parse(text) as T,
      text,
    };
  } catch {
    return {
      ok: response.ok,
      status: response.status,
      data: null,
      text,
    };
  }
}

function buildGetAddressUrl(path: string, apiKey: string, params?: URLSearchParams): string {
  const search = params ?? new URLSearchParams();
  search.set("api-key", apiKey);
  return `${GETADDRESS_API_BASE}${path}?${search.toString()}`;
}

function mapStringAddress(
  value: string,
  index: number,
  postcode: string,
  coordinates: { latitude: number; longitude: number },
  id?: string,
) {
  const parts = value.split(",").map((part) => part.trim()).filter(Boolean);
  const venueName = parts.length > 2 ? parts[0] : "";
  const addressLine1 = venueName ? (parts[1] ?? parts[0]) : (parts[0] ?? "");
  const addressLine2 =
    venueName && parts.length > 3 ? (parts[2] ?? "") : "";
  const townCity =
    parts.length > 1 ? (parts[parts.length - 2] ?? parts[parts.length - 1] ?? "") : "";

  return {
    id: id ?? `${normalizeUkPostcode(postcode)}-${index}`,
    venueName,
    addressLine1,
    addressLine2,
    townCity,
    postcode: normalizeUkPostcode(postcode),
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
  };
}

async function lookupViaFind(
  normalizedPostcode: string,
  apiKey: string,
): Promise<UkAddressLookupResult | null> {
  const compactPostcode = formatPostcodeForGetAddressPath(normalizedPostcode);

  for (const expand of [true, false] as const) {
    const params = new URLSearchParams();
    if (expand) {
      params.set("expand", "true");
    }

    const url = buildGetAddressUrl(`/find/${compactPostcode}`, apiKey, params);
    const result = await safeFetchJson<GetAddressFindResponse & { Message?: string }>(
      url,
    );

    if (result.status === 401 || result.status === 403) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`${LOG_PREFIX} Find lookup rejected request`, {
          postcode: normalizedPostcode,
          expand,
          status: result.status,
        });
      }
      return null;
    }

    if (!result.ok) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`${LOG_PREFIX} Find lookup unavailable`, {
          postcode: normalizedPostcode,
          expand,
          status: result.status,
          body: result.text.slice(0, 200),
        });
      }

      continue;
    }

    if (!result.data) {
      continue;
    }

    const expandedAddresses = result.data.addresses ?? [];

    if (expandedAddresses.length === 0) {
      continue;
    }

    const coordinates = await resolvePostcodeCoordinates(
      result.data.postcode ?? normalizedPostcode,
      {
        latitude: result.data.latitude,
        longitude: result.data.longitude,
      },
    );

    const firstAddress = expandedAddresses[0];

    if (typeof firstAddress === "string") {
      return {
        postcode: coordinates.postcode,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        addresses: expandedAddresses
          .filter((address): address is string => typeof address === "string")
          .slice(0, MAX_ADDRESS_SUGGESTIONS)
          .map((address, index) =>
            mapStringAddress(address, index, coordinates.postcode, coordinates),
          ),
      };
    }

    return {
      postcode: coordinates.postcode,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      addresses: expandedAddresses
        .filter(
          (address): address is GetAddressExpandedAddress =>
            typeof address !== "string",
        )
        .slice(0, MAX_ADDRESS_SUGGESTIONS)
        .map((address, index) =>
          mapExpandedAddress(address, index, coordinates.postcode, coordinates),
        ),
    };
  }

  return null;
}

async function lookupViaAutocomplete(
  normalizedPostcode: string,
  apiKey: string,
): Promise<UkAddressLookupResult | null> {
  const term = encodeURIComponent(normalizedPostcode);
  const params = new URLSearchParams({ all: "true" });
  const url = buildGetAddressUrl(`/autocomplete/${term}`, apiKey, params);

  const attempts: RequestInit[] = [
    {},
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    },
  ];

  for (const init of attempts) {
    const result = await safeFetchJson<GetAddressAutocompleteResponse>(url, init);

    if (result.status === 401 || result.status === 403) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`${LOG_PREFIX} Autocomplete rejected request`, {
          postcode: normalizedPostcode,
          status: result.status,
          method: init.method ?? "GET",
        });
      }
      continue;
    }

    if (!result.ok) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`${LOG_PREFIX} Autocomplete lookup unavailable`, {
          postcode: normalizedPostcode,
          status: result.status,
          method: init.method ?? "GET",
          body: result.text.slice(0, 200),
        });
      }
      continue;
    }

    const suggestions = (result.data?.suggestions ?? []).slice(
      0,
      MAX_ADDRESS_SUGGESTIONS,
    );

    if (suggestions.length === 0) {
      continue;
    }

    const coordinates = await resolvePostcodeCoordinates(normalizedPostcode);

    return {
      postcode: coordinates.postcode,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      addresses: suggestions.map((suggestion, index) =>
        mapStringAddress(
          suggestion.address,
          index,
          coordinates.postcode,
          coordinates,
          suggestion.id,
        ),
      ),
    };
  }

  return null;
}

export async function lookupUkAddressesByPostcodeServer(
  postcode: string,
): Promise<UkAddressLookupResult> {
  const apiKey = getGetAddressApiKey();

  if (!apiKey) {
    throw new GetAddressLookupError(GETADDRESS_NOT_CONFIGURED_MESSAGE);
  }

  const normalizedPostcode = normalizeUkPostcode(postcode);

  if (!normalizedPostcode) {
    throw new GetAddressLookupError(GETADDRESS_NO_ADDRESSES_MESSAGE);
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`${LOG_PREFIX} Fetching addresses`, {
      postcode: normalizedPostcode,
    });
  }

  const findResult = await lookupViaFind(normalizedPostcode, apiKey);
  const result =
    findResult ?? (await lookupViaAutocomplete(normalizedPostcode, apiKey));

  if (!result || result.addresses.length === 0) {
    throw new GetAddressLookupError(GETADDRESS_NO_ADDRESSES_MESSAGE);
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`${LOG_PREFIX} Address lookup complete`, {
      postcode: result.postcode,
      addressCount: result.addresses.length,
      latitude: result.latitude,
      longitude: result.longitude,
    });
  }

  return result;
}
