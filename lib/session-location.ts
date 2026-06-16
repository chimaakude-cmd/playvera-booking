import type { ClubSession } from "./sessions";

export type SessionVenue = {
  venueName: string;
  addressLine1: string;
  addressLine2?: string;
  townCity: string;
  postcode: string;
  locationNotes?: string;
  latitude?: number | null;
  longitude?: number | null;
};

export type SessionVenueForm = {
  venueName: string;
  addressLine1: string;
  addressLine2: string;
  townCity: string;
  postcode: string;
  locationNotes: string;
  latitude: string;
  longitude: string;
  pinConfirmed: boolean;
  postcodeValidated: boolean;
  addressResolved: boolean;
  providerVenueId: string | null;
  isAddingNewVenue: boolean;
};

export const initialSessionVenueForm: SessionVenueForm = {
  venueName: "",
  addressLine1: "",
  addressLine2: "",
  townCity: "",
  postcode: "",
  locationNotes: "",
  latitude: "",
  longitude: "",
  pinConfirmed: false,
  postcodeValidated: false,
  addressResolved: false,
  providerVenueId: null,
  isAddingNewVenue: false,
};

export function parseOptionalCoordinate(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function venueFormToSessionVenue(form: SessionVenueForm): SessionVenue {
  return {
    venueName: form.venueName.trim(),
    addressLine1: form.addressLine1.trim(),
    addressLine2: form.addressLine2.trim() || undefined,
    townCity: form.townCity.trim(),
    postcode: form.postcode.trim().toUpperCase(),
    locationNotes: form.locationNotes.trim() || undefined,
    latitude: parseOptionalCoordinate(form.latitude),
    longitude: parseOptionalCoordinate(form.longitude),
  };
}

export function sessionVenueToForm(
  venue: SessionVenue | undefined,
  providerVenueId: string | null = null,
): SessionVenueForm {
  if (!venue) {
    return initialSessionVenueForm;
  }

  return {
    venueName: venue.venueName,
    addressLine1: venue.addressLine1,
    addressLine2: venue.addressLine2 ?? "",
    townCity: venue.townCity,
    postcode: venue.postcode,
    locationNotes: venue.locationNotes ?? "",
    latitude:
      venue.latitude === null || venue.latitude === undefined
        ? ""
        : String(venue.latitude),
    longitude:
      venue.longitude === null || venue.longitude === undefined
        ? ""
        : String(venue.longitude),
    pinConfirmed:
      venue.latitude !== null &&
      venue.latitude !== undefined &&
      venue.longitude !== null &&
      venue.longitude !== undefined &&
      Number.isFinite(venue.latitude) &&
      Number.isFinite(venue.longitude),
    postcodeValidated: Boolean(venue.postcode?.trim()),
    addressResolved: Boolean(venue.postcode?.trim()),
    providerVenueId,
    isAddingNewVenue: false,
  };
}

export function buildSessionLocationLabel(venue: SessionVenue): string {
  return [venue.venueName, venue.townCity, venue.postcode]
    .filter(Boolean)
    .join(", ");
}

export function formatSessionLocation(session: ClubSession): string {
  if (session.venue?.venueName) {
    return buildSessionLocationLabel(session.venue);
  }

  return session.location || "Activora Club";
}

export function formatSessionVenueAddress(session: ClubSession): string {
  if (!session.venue) {
    return session.location || "";
  }

  const lines = [
    session.venue.addressLine1,
    session.venue.addressLine2,
    [session.venue.townCity, session.venue.postcode].filter(Boolean).join(" "),
  ].filter(Boolean);

  return lines.join(", ");
}

export const VENUE_PIN_REQUIRED_MESSAGE =
  "Please confirm the venue pin on the map before continuing.";

export const VENUE_SELECTION_REQUIRED_MESSAGE =
  "Select a saved venue or save this venue before continuing.";

export const VENUE_ADDRESS_REQUIRED_MESSAGE =
  "Select an address from the list or enter the address manually.";

export function validateSessionVenueForm(form: SessionVenueForm): string[] {
  const errors: string[] = [];

  if (!form.venueName.trim()) {
    errors.push("Venue name is required");
  }

  if (!form.addressLine1.trim()) {
    errors.push("Address line 1 is required");
  }

  if (!form.townCity.trim()) {
    errors.push("Town/city is required");
  }

  if (!form.postcode.trim()) {
    errors.push("Postcode is required");
  } else if (!form.postcodeValidated) {
    errors.push("Find addresses for the postcode before continuing.");
  } else if (!form.addressResolved && !form.providerVenueId) {
    errors.push(VENUE_ADDRESS_REQUIRED_MESSAGE);
  }

  const latitude = parseOptionalCoordinate(form.latitude);
  const longitude = parseOptionalCoordinate(form.longitude);

  if (form.latitude.trim() && latitude === null) {
    errors.push("Latitude must be a valid number");
  }

  if (form.longitude.trim() && longitude === null) {
    errors.push("Longitude must be a valid number");
  }

  if (latitude === null || longitude === null) {
    errors.push("Find the postcode on the map to place a pin.");
  } else if (!form.pinConfirmed) {
    errors.push(VENUE_PIN_REQUIRED_MESSAGE);
  }

  if (!form.providerVenueId) {
    errors.push(VENUE_SELECTION_REQUIRED_MESSAGE);
  }

  return errors;
}

export function sessionMatchesLocationQuery(
  session: ClubSession,
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  const venue = session.venue;
  const haystack = [
    session.sessionTitle,
    session.location,
    venue?.venueName,
    venue?.addressLine1,
    venue?.addressLine2,
    venue?.townCity,
    venue?.postcode,
    venue?.locationNotes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}
