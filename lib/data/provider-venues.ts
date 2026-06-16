import { getOrCreateDefaultProviderId } from "@/lib/data/providers/supabase/default-provider";
import { formatPostgrestError, SupabaseSaveError } from "@/lib/data/supabase-errors";
import {
  mapProviderVenueRow,
  type ProviderVenue,
  type ProviderVenueInput,
  type ProviderVenueRow,
} from "@/lib/provider-venues";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

function assertSupabaseConfigured(): void {
  if (!isSupabaseConfigured()) {
    throw new SupabaseSaveError(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
    );
  }
}

function mapInputToInsertRow(providerId: string, input: ProviderVenueInput) {
  return {
    provider_id: providerId,
    venue_name: input.venueName,
    address_line_1: input.addressLine1,
    address_line_2: input.addressLine2,
    town_city: input.townCity,
    postcode: input.postcode,
    location_notes: input.locationNotes,
    latitude: input.latitude,
    longitude: input.longitude,
  };
}

export async function loadProviderVenues(): Promise<ProviderVenue[]> {
  assertSupabaseConfigured();

  const supabase = getSupabaseBrowserClient();
  const providerId = await getOrCreateDefaultProviderId();

  const { data, error } = await supabase
    .from("provider_venues")
    .select("*")
    .eq("provider_id", providerId)
    .order("venue_name", { ascending: true });

  if (error) {
    throw new SupabaseSaveError(
      formatPostgrestError("provider_venues select", error),
      error,
    );
  }

  return ((data ?? []) as ProviderVenueRow[]).map(mapProviderVenueRow);
}

export async function saveProviderVenue(
  input: ProviderVenueInput,
): Promise<ProviderVenue> {
  assertSupabaseConfigured();

  const supabase = getSupabaseBrowserClient();
  const providerId = await getOrCreateDefaultProviderId();

  const { data, error } = await supabase
    .from("provider_venues")
    .insert(mapInputToInsertRow(providerId, input))
    .select("*")
    .single();

  if (error) {
    throw new SupabaseSaveError(
      formatPostgrestError("provider_venues insert", error),
      error,
    );
  }

  return mapProviderVenueRow(data as ProviderVenueRow);
}

export async function deleteProviderVenue(venueId: string): Promise<void> {
  assertSupabaseConfigured();

  const supabase = getSupabaseBrowserClient();
  const providerId = await getOrCreateDefaultProviderId();

  const { error } = await supabase
    .from("provider_venues")
    .delete()
    .eq("id", venueId)
    .eq("provider_id", providerId);

  if (error) {
    throw new SupabaseSaveError(
      formatPostgrestError("provider_venues delete", error),
      error,
    );
  }
}
