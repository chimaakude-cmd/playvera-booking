"use client";

import { useEffect, useState } from "react";
import { SavedVenuesList } from "@/components/club/SavedVenuesList";
import {
  deleteProviderVenue,
  loadProviderVenues,
  saveProviderVenue,
} from "@/lib/data";
import {
  GETADDRESS_NO_ADDRESSES_MESSAGE,
  GETADDRESS_NOT_CONFIGURED_MESSAGE,
  lookupUkAddressesByPostcode,
  type UkAddressOption,
} from "@/lib/getaddress-io";
import { lookupUkPostcode } from "@/lib/postcodes-io";
import {
  canSaveProviderVenueFromForm,
  createEmptyVenueForm,
  mapProviderVenueToSessionVenueForm,
  mapSessionVenueFormToProviderVenueInput,
  type ProviderVenue,
} from "@/lib/provider-venues";
import { initialSessionVenueForm, SessionVenueForm } from "@/lib/session-location";
import { WizardFormData } from "@/lib/session-wizard";
import { GetAddressPicker } from "./GetAddressPicker";
import { VenuePinMap } from "./VenuePinMap";
import {
  StepSection,
  WizardField,
  wizardInputClassName,
  wizardTextareaClassName,
} from "./shared";

type AddressLookupMode = "idle" | "choosing" | "selected" | "manual";

type LocationStepProps = {
  data: WizardFormData;
  onChange: (updates: Partial<WizardFormData>) => void;
};

export function LocationStep({ data, onChange }: LocationStepProps) {
  const [savedVenues, setSavedVenues] = useState<ProviderVenue[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [venuesError, setVenuesError] = useState<string | null>(null);
  const [findingPostcode, setFindingPostcode] = useState(false);
  const [findError, setFindError] = useState<string | null>(null);
  const [savingVenue, setSavingVenue] = useState(false);
  const [saveVenueError, setSaveVenueError] = useState<string | null>(null);
  const [deletingVenueId, setDeletingVenueId] = useState<string | null>(null);
  const [addressOptions, setAddressOptions] = useState<UkAddressOption[]>([]);
  const [addressLookupMode, setAddressLookupMode] =
    useState<AddressLookupMode>("idle");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [postcodeCoordinates, setPostcodeCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const { venue } = data;
  const showVenueForm = venue.isAddingNewVenue || Boolean(venue.providerVenueId);
  const showAddressPicker = showVenueForm && addressLookupMode === "choosing";
  const showAddressFields =
    showVenueForm &&
    (Boolean(venue.providerVenueId) || addressLookupMode !== "choosing");
  const canSaveVenue = canSaveProviderVenueFromForm(venue);

  useEffect(() => {
    async function loadVenues() {
      setLoadingVenues(true);
      setVenuesError(null);

      try {
        const venues = await loadProviderVenues();
        setSavedVenues(venues);

        if (venues.length === 0 && !venue.providerVenueId && !venue.isAddingNewVenue) {
          onChange({
            venue: {
              ...data.venue,
              isAddingNewVenue: true,
            },
          });
        }
      } catch (error) {
        setVenuesError(
          error instanceof Error
            ? error.message
            : "Could not load saved venues.",
        );
      } finally {
        setLoadingVenues(false);
      }
    }

    void loadVenues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetAddressLookupState() {
    setAddressOptions([]);
    setAddressLookupMode("idle");
    setSelectedAddressId(null);
    setPostcodeCoordinates(null);
  }

  function updateVenue(updates: Partial<SessionVenueForm>) {
    onChange({
      venue: {
        ...data.venue,
        ...updates,
      },
    });
  }

  function clearSavedVenueSelection(updates: Partial<SessionVenueForm> = {}) {
    updateVenue({
      providerVenueId: null,
      isAddingNewVenue: true,
      ...updates,
    });
  }

  function handleVenueFieldChange(updates: Partial<SessionVenueForm>) {
    if (venue.providerVenueId) {
      clearSavedVenueSelection(updates);
      return;
    }

    updateVenue(updates);
  }

  function handleCoordinatesChange(latitude: string, longitude: string) {
    clearSavedVenueSelection({
      latitude,
      longitude,
      pinConfirmed: false,
    });
  }

  function handlePinConfirmedChange(confirmed: boolean) {
    if (venue.providerVenueId && !confirmed) {
      clearSavedVenueSelection({ pinConfirmed: false });
      return;
    }

    updateVenue({ pinConfirmed: confirmed });
  }

  function handlePostcodeChange(value: string) {
    resetAddressLookupState();
    clearSavedVenueSelection({
      postcode: value.toUpperCase(),
      latitude: "",
      longitude: "",
      pinConfirmed: false,
      postcodeValidated: false,
      addressResolved: false,
    });
    setFindError(null);
  }

  function handleSelectSavedVenue(selectedVenue: ProviderVenue) {
    setSaveVenueError(null);
    resetAddressLookupState();
    onChange({
      venue: mapProviderVenueToSessionVenueForm(selectedVenue),
    });
  }

  function handleAddNewVenue() {
    setSaveVenueError(null);
    resetAddressLookupState();
    onChange({
      venue: createEmptyVenueForm(),
    });
  }

  function applyPostcodeCoordinates(
    latitude: number,
    longitude: number,
    updates: Partial<SessionVenueForm> = {},
  ) {
    setPostcodeCoordinates({ latitude, longitude });
    clearSavedVenueSelection({
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
      pinConfirmed: false,
      ...updates,
    });
  }

  function handleSelectAddress(address: UkAddressOption) {
    setSaveVenueError(null);
    setSelectedAddressId(address.id);
    setAddressLookupMode("selected");

    const latitude = address.latitude ?? postcodeCoordinates?.latitude;
    const longitude = address.longitude ?? postcodeCoordinates?.longitude;

    if (latitude === undefined || longitude === undefined) {
      setFindError("Could not find postcode coordinates.");
      return;
    }

    clearSavedVenueSelection({
      venueName: address.venueName,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      townCity: address.townCity,
      postcode: address.postcode,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
      pinConfirmed: false,
      postcodeValidated: true,
      addressResolved: true,
    });
  }

  function handleEnterManually() {
    if (!postcodeCoordinates) {
      setFindError("Could not find postcode coordinates.");
      return;
    }

    setSaveVenueError(null);
    setSelectedAddressId(null);
    setAddressLookupMode("manual");

    applyPostcodeCoordinates(postcodeCoordinates.latitude, postcodeCoordinates.longitude, {
      venueName: "",
      addressLine1: "",
      addressLine2: "",
      townCity: "",
      locationNotes: "",
      postcode: venue.postcode.trim().toUpperCase(),
      postcodeValidated: true,
      addressResolved: true,
    });
  }

  async function handleFindPostcode() {
    if (!venue.postcode.trim()) {
      return;
    }

    setFindingPostcode(true);
    setFindError(null);
    setSaveVenueError(null);
    resetAddressLookupState();

    try {
      const lookup = await lookupUkAddressesByPostcode(venue.postcode);

      setAddressOptions(lookup.addresses);
      setPostcodeCoordinates({
        latitude: lookup.latitude,
        longitude: lookup.longitude,
      });
      setAddressLookupMode("choosing");

      clearSavedVenueSelection({
        postcode: lookup.postcode,
        latitude: lookup.latitude.toFixed(6),
        longitude: lookup.longitude.toFixed(6),
        pinConfirmed: false,
        postcodeValidated: true,
        addressResolved: false,
        venueName: "",
        addressLine1: "",
        addressLine2: "",
        townCity: "",
        locationNotes: "",
      });
    } catch (error) {
      resetAddressLookupState();
      setFindError(
        error instanceof Error ? error.message : GETADDRESS_NO_ADDRESSES_MESSAGE,
      );

      try {
        const coordinateLookup = await lookupUkPostcode(venue.postcode);
        setPostcodeCoordinates({
          latitude: coordinateLookup.latitude,
          longitude: coordinateLookup.longitude,
        });
        setAddressLookupMode("manual");
        clearSavedVenueSelection({
          postcode: coordinateLookup.postcode,
          latitude: coordinateLookup.latitude.toFixed(6),
          longitude: coordinateLookup.longitude.toFixed(6),
          pinConfirmed: false,
          postcodeValidated: true,
          addressResolved: true,
          venueName: "",
          addressLine1: "",
          addressLine2: "",
          townCity: "",
          locationNotes: "",
        });
      } catch {
        // Keep the lookup error and let the user correct the postcode.
      }
    } finally {
      setFindingPostcode(false);
    }
  }

  async function handleSaveVenue() {
    if (!canSaveVenue) {
      return;
    }

    setSavingVenue(true);
    setSaveVenueError(null);

    try {
      const input = mapSessionVenueFormToProviderVenueInput(venue);
      const saved = await saveProviderVenue(input);
      setSavedVenues((current) =>
        [...current, saved].sort((left, right) =>
          left.venueName.localeCompare(right.venueName),
        ),
      );
      resetAddressLookupState();
      onChange({
        venue: mapProviderVenueToSessionVenueForm(saved),
      });
    } catch (error) {
      setSaveVenueError(
        error instanceof Error ? error.message : "Could not save this venue.",
      );
    } finally {
      setSavingVenue(false);
    }
  }

  async function handleDeleteVenue(venueId: string) {
    setDeletingVenueId(venueId);
    setVenuesError(null);

    try {
      await deleteProviderVenue(venueId);
      setSavedVenues((current) => current.filter((item) => item.id !== venueId));

      if (venue.providerVenueId === venueId) {
        resetAddressLookupState();
        onChange({
          venue:
            savedVenues.length > 1
              ? initialSessionVenueForm
              : createEmptyVenueForm(),
        });
      }
    } catch (error) {
      setVenuesError(
        error instanceof Error ? error.message : "Could not delete venue.",
      );
    } finally {
      setDeletingVenueId(null);
    }
  }

  return (
    <StepSection
      title="Venue & location"
      description="Choose a saved venue or find addresses for a UK postcode, confirm the map pin, and save the venue."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-zinc-900">
                Choose a saved venue
              </p>
              {savedVenues.length > 0 ? (
                <button
                  type="button"
                  onClick={handleAddNewVenue}
                  className="text-sm font-semibold text-pink-600 hover:text-pink-700"
                >
                  Add new address
                </button>
              ) : null}
            </div>

            {loadingVenues ? (
              <p className="text-sm text-zinc-500">Loading saved venues...</p>
            ) : venuesError ? (
              <p className="text-sm text-red-600">{venuesError}</p>
            ) : (
              <SavedVenuesList
                venues={savedVenues}
                selectedVenueId={venue.providerVenueId}
                onSelect={handleSelectSavedVenue}
                onDelete={handleDeleteVenue}
                deletingVenueId={deletingVenueId}
              />
            )}
          </div>

          {showVenueForm ? (
            <>
              <WizardField label="Postcode" htmlFor="postcode">
                <div className="flex gap-2">
                  <input
                    id="postcode"
                    type="text"
                    value={venue.postcode}
                    onChange={(event) => handlePostcodeChange(event.target.value)}
                    placeholder="DA14 5BU"
                    className={`${wizardInputClassName} min-w-0 flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => void handleFindPostcode()}
                    disabled={findingPostcode || !venue.postcode.trim()}
                    className="shrink-0 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-60"
                  >
                    {findingPostcode ? "Finding..." : "Find postcode"}
                  </button>
                </div>
              </WizardField>

              {findError ? (
                <p className="text-sm text-red-600">{findError}</p>
              ) : null}

              {!getGetAddressApiKeyConfigured() && showVenueForm ? (
                <p className="text-sm text-amber-800">
                  {GETADDRESS_NOT_CONFIGURED_MESSAGE}
                </p>
              ) : null}

              {showAddressPicker ? (
                <GetAddressPicker
                  addresses={addressOptions}
                  selectedAddressId={selectedAddressId}
                  onSelectAddress={handleSelectAddress}
                  onEnterManually={handleEnterManually}
                />
              ) : null}

              {venue.latitude && venue.longitude && addressLookupMode !== "choosing" ? (
                <VenuePinMap
                  venue={venue}
                  onCoordinatesChange={handleCoordinatesChange}
                  onPinConfirmedChange={handlePinConfirmedChange}
                />
              ) : null}

              {showAddressFields ? (
                <div className="space-y-5 border-t border-zinc-200 pt-5">
                  <p className="text-sm font-semibold text-zinc-900">Venue address</p>

                  <WizardField label="Venue name" htmlFor="venue-name">
                    <input
                      id="venue-name"
                      type="text"
                      value={venue.venueName}
                      onChange={(event) =>
                        handleVenueFieldChange({ venueName: event.target.value })
                      }
                      placeholder="e.g. Riverside Community Centre"
                      className={wizardInputClassName}
                    />
                  </WizardField>

                  <WizardField label="Address line 1" htmlFor="address-line-1">
                    <input
                      id="address-line-1"
                      type="text"
                      value={venue.addressLine1}
                      onChange={(event) =>
                        handleVenueFieldChange({ addressLine1: event.target.value })
                      }
                      placeholder="Street address"
                      className={wizardInputClassName}
                    />
                  </WizardField>

                  <WizardField
                    label="Address line 2"
                    htmlFor="address-line-2"
                    hint="Optional"
                  >
                    <input
                      id="address-line-2"
                      type="text"
                      value={venue.addressLine2}
                      onChange={(event) =>
                        handleVenueFieldChange({ addressLine2: event.target.value })
                      }
                      placeholder="Building, unit, or entrance"
                      className={wizardInputClassName}
                    />
                  </WizardField>

                  <WizardField label="Town/city" htmlFor="town-city">
                    <input
                      id="town-city"
                      type="text"
                      value={venue.townCity}
                      onChange={(event) =>
                        handleVenueFieldChange({ townCity: event.target.value })
                      }
                      placeholder="London"
                      className={wizardInputClassName}
                    />
                  </WizardField>

                  <WizardField label="Postcode" htmlFor="venue-postcode">
                    <input
                      id="venue-postcode"
                      type="text"
                      value={venue.postcode}
                      readOnly
                      className={`${wizardInputClassName} bg-zinc-50 text-zinc-700`}
                    />
                  </WizardField>

                  <WizardField
                    label="Location notes for parents"
                    htmlFor="location-notes"
                    hint="Optional arrival, parking, or pickup instructions"
                  >
                    <textarea
                      id="location-notes"
                      value={venue.locationNotes}
                      onChange={(event) =>
                        handleVenueFieldChange({ locationNotes: event.target.value })
                      }
                      placeholder="Meet at the main reception desk. Parking available on site."
                      className={wizardTextareaClassName}
                    />
                  </WizardField>

                  {venue.isAddingNewVenue && !venue.providerVenueId ? (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => void handleSaveVenue()}
                        disabled={!canSaveVenue || savingVenue}
                        className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-60"
                      >
                        {savingVenue ? "Saving venue..." : "Save this venue"}
                      </button>
                      {saveVenueError ? (
                        <p className="text-sm text-red-600">{saveVenueError}</p>
                      ) : null}
                      <p className="text-xs text-zinc-500">
                        Save this venue to reuse it on future sessions.
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">
            Parent preview
          </p>
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5">
            <p className="text-sm font-semibold text-zinc-900">
              {venue.venueName || "Venue name"}
            </p>
            <p className="mt-2 text-sm text-zinc-600">
              {venue.addressLine1 || "Address line 1"}
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              {[venue.townCity, venue.postcode].filter(Boolean).join(" ") ||
                "Town/city and postcode"}
            </p>
            {venue.pinConfirmed ? (
              <p className="mt-4 text-xs font-medium text-green-700">
                Map pin confirmed
              </p>
            ) : null}
            {venue.providerVenueId ? (
              <p className="mt-2 text-xs font-medium text-zinc-500">
                Saved venue selected
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </StepSection>
  );
}

function getGetAddressApiKeyConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GETADDRESS_API_KEY?.trim());
}
