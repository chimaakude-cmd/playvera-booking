import type { SessionVenueForm } from "@/lib/session-location";
import { initialSessionVenueForm, parseOptionalCoordinate } from "@/lib/session-location";

export type ProviderVenue = {
  id: string;
  providerId: string;
  venueName: string;
  addressLine1: string;
  addressLine2: string;
  townCity: string;
  postcode: string;
  locationNotes: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
};

export type ProviderVenueInput = Omit<
  ProviderVenue,
  "id" | "providerId" | "createdAt" | "updatedAt"
>;

export type ProviderVenueRow = {
  id: string;
  provider_id: string;
  venue_name: string;
  address_line_1: string;
  address_line_2: string;
  town_city: string;
  postcode: string;
  location_notes: string;
  latitude: number | string;
  longitude: number | string;
  created_at: string;
  updated_at: string;
};

export function mapProviderVenueRow(row: ProviderVenueRow): ProviderVenue {
  return {
    id: row.id,
    providerId: row.provider_id,
    venueName: row.venue_name,
    addressLine1: row.address_line_1,
    addressLine2: row.address_line_2,
    townCity: row.town_city,
    postcode: row.postcode,
    locationNotes: row.location_notes,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapProviderVenueToSessionVenueForm(
  venue: ProviderVenue,
): SessionVenueForm {
  return {
    venueName: venue.venueName,
    addressLine1: venue.addressLine1,
    addressLine2: venue.addressLine2,
    townCity: venue.townCity,
    postcode: venue.postcode,
    locationNotes: venue.locationNotes,
    latitude: venue.latitude.toFixed(6),
    longitude: venue.longitude.toFixed(6),
    pinConfirmed: true,
    postcodeValidated: true,
    addressResolved: true,
    providerVenueId: venue.id,
    isAddingNewVenue: false,
  };
}

export function mapSessionVenueFormToProviderVenueInput(
  form: SessionVenueForm,
): ProviderVenueInput {
  const latitude = parseOptionalCoordinate(form.latitude);
  const longitude = parseOptionalCoordinate(form.longitude);

  if (latitude === null || longitude === null) {
    throw new Error("Venue coordinates are required before saving.");
  }

  return {
    venueName: form.venueName.trim(),
    addressLine1: form.addressLine1.trim(),
    addressLine2: form.addressLine2.trim(),
    townCity: form.townCity.trim(),
    postcode: form.postcode.trim().toUpperCase(),
    locationNotes: form.locationNotes.trim(),
    latitude,
    longitude,
  };
}

export function createEmptyVenueForm(): SessionVenueForm {
  return {
    ...initialSessionVenueForm,
    isAddingNewVenue: true,
  };
}

export function canSaveProviderVenueFromForm(form: SessionVenueForm): boolean {
  return (
    Boolean(form.venueName.trim()) &&
    Boolean(form.addressLine1.trim()) &&
    Boolean(form.townCity.trim()) &&
    Boolean(form.postcode.trim()) &&
    form.pinConfirmed &&
    parseOptionalCoordinate(form.latitude) !== null &&
    parseOptionalCoordinate(form.longitude) !== null &&
    !form.providerVenueId
  );
}

export function formatProviderVenueSummary(venue: ProviderVenue): string {
  return [venue.venueName, venue.townCity, venue.postcode]
    .filter(Boolean)
    .join(" · ");
}
