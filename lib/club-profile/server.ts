import type { PostgrestError } from "@supabase/supabase-js";
import type { ActivoraSupabaseClient } from "@/lib/supabase";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
  isSupabaseConfigured,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase";
import {
  mapClubProfileInputToRow,
  mapClubProfileRowToProfile,
  mapLocationInputToRow,
} from "./db-mapper";
import type { ClubProfile, ClubProfileInput } from "./types";
import { slugifyClubName } from "./types";

const PROFILE_SELECT = `
  *,
  club_profile_locations (*)
`;

type ProfileQueryRow = {
  club_profile_locations?: Array<{
    id: string;
    club_profile_id: string;
    venue_name: string;
    address_line_1: string;
    address_line_2: string;
    town_city: string;
    postcode: string;
    latitude: number;
    longitude: number;
    radius_miles: number;
    is_main: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
  }> | null;
} & import("@/lib/database.types").Database["public"]["Tables"]["club_profiles"]["Row"];

function mapQueryRow(row: ProfileQueryRow): ClubProfile {
  const locations = row.club_profile_locations ?? [];
  const sortedLocations = [...locations].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  return mapClubProfileRowToProfile(row, sortedLocations);
}

export async function resolveProviderIdForAuthUser(
  supabase: ActivoraSupabaseClient,
  authUserId: string,
): Promise<string | null> {
  const { data: provider } = await supabase
    .from("providers")
    .select("id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (provider?.id) {
    return provider.id;
  }

  const { data: teamMember } = await supabase
    .from("club_team_members")
    .select("provider_id")
    .eq("auth_user_id", authUserId)
    .eq("status", "active")
    .maybeSingle();

  return teamMember?.provider_id ?? null;
}

export async function fetchClubProfileForProvider(
  supabase: ActivoraSupabaseClient,
  providerId: string,
): Promise<ClubProfile | null> {
  const { data, error } = await supabase
    .from("club_profiles")
    .select(PROFILE_SELECT)
    .eq("provider_id", providerId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapQueryRow(data as ProfileQueryRow);
}

export async function fetchPublicClubProfileBySlug(
  slug: string,
): Promise<ClubProfile | null> {
  const normalizedSlug = slug.trim().toLowerCase();
  if (!normalizedSlug || !isSupabaseConfigured()) {
    return null;
  }

  const clients: ActivoraSupabaseClient[] = [createSupabaseServerClient()];
  if (isSupabaseServiceRoleConfigured()) {
    clients.push(createSupabaseServiceRoleClient());
  }

  for (const supabase of clients) {
    const byPublicSlug = await queryPublicClubProfile(
      supabase,
      (query) => query.eq("public_slug", normalizedSlug),
    );
    if (byPublicSlug) {
      return byPublicSlug;
    }

    const byProviderSlug = await fetchPublicClubProfileByProviderSlug(
      supabase,
      normalizedSlug,
    );
    if (byProviderSlug) {
      return byProviderSlug;
    }
  }

  return null;
}

function isPublicClubProfileRow(
  row: Pick<
    ProfileQueryRow,
    "visibility" | "published" | "public_slug"
  >,
): boolean {
  const slug = row.public_slug?.trim();
  if (!slug) {
    return false;
  }

  if (row.visibility === "published" || row.visibility === "hidden") {
    return true;
  }

  // Legacy rows created before visibility enum (published flag only).
  return row.published === true;
}

async function queryPublicClubProfile(
  supabase: ActivoraSupabaseClient,
  applyFilter: (
    query: ReturnType<ActivoraSupabaseClient["from"]>,
  ) => ReturnType<ActivoraSupabaseClient["from"]>,
): Promise<ClubProfile | null> {
  const baseQuery = supabase.from("club_profiles").select(PROFILE_SELECT);
  const { data, error } = await applyFilter(baseQuery).maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as ProfileQueryRow;
  if (!isPublicClubProfileRow(row)) {
    return null;
  }

  return mapQueryRow(row);
}

async function fetchPublicClubProfileByProviderSlug(
  supabase: ActivoraSupabaseClient,
  slug: string,
): Promise<ClubProfile | null> {
  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (providerError || !provider?.id) {
    return null;
  }

  return queryPublicClubProfile(supabase, (query) =>
    query.eq("provider_id", provider.id),
  );
}

async function syncClubProfileLocations(
  supabase: ActivoraSupabaseClient,
  clubProfileId: string,
  input: ClubProfileInput,
): Promise<PostgrestError | null> {
  const { error: deleteError } = await supabase
    .from("club_profile_locations")
    .delete()
    .eq("club_profile_id", clubProfileId);

  if (deleteError) {
    return deleteError;
  }

  if (input.locations.length === 0) {
    return null;
  }

  const rows = input.locations.map((location, index) =>
    mapLocationInputToRow(clubProfileId, location, index),
  );

  const { error: insertError } = await supabase
    .from("club_profile_locations")
    .insert(rows);

  return insertError;
}

export async function saveClubProfileForProvider(
  supabase: ActivoraSupabaseClient,
  providerId: string,
  input: ClubProfileInput,
): Promise<
  | { ok: true; profile: ClubProfile }
  | { ok: false; error: string; code?: string }
> {
  const slug = input.publicSlug.trim() || slugifyClubName(input.clubName);

  const { data: existing, error: lookupError } = await supabase
    .from("club_profiles")
    .select("id, public_slug")
    .eq("provider_id", providerId)
    .maybeSingle();

  if (lookupError) {
    return { ok: false, error: lookupError.message };
  }

  if (slug) {
    const { data: slugConflict } = await supabase
      .from("club_profiles")
      .select("id")
      .eq("public_slug", slug)
      .neq("provider_id", providerId)
      .maybeSingle();

    if (slugConflict?.id) {
      return {
        ok: false,
        error: "That public URL is already taken. Choose a different slug.",
        code: "slug_taken",
      };
    }
  }

  const profileId = existing?.id ?? crypto.randomUUID();
  const row = mapClubProfileInputToRow(profileId, providerId, {
    ...input,
    publicSlug: slug,
  });

  let saveError: PostgrestError | null = null;

  if (existing?.id) {
    const { error } = await supabase
      .from("club_profiles")
      .update(row)
      .eq("provider_id", providerId);
    saveError = error;
  } else {
    const { error } = await supabase.from("club_profiles").insert(row);
    saveError = error;
  }

  if (saveError) {
    return { ok: false, error: saveError.message };
  }

  if (slug) {
    await supabase
      .from("providers")
      .update({ slug })
      .eq("id", providerId);
  }

  const locationError = await syncClubProfileLocations(
    supabase,
    profileId,
    input,
  );

  if (locationError) {
    return { ok: false, error: locationError.message };
  }

  const profile = await fetchClubProfileForProvider(supabase, providerId);
  if (!profile) {
    return { ok: false, error: "Profile saved but could not be reloaded." };
  }

  return { ok: true, profile };
}

/** Service-role read for internal tooling when RLS blocks anon reads. */
export async function fetchPublicClubProfileBySlugAdmin(
  slug: string,
): Promise<ClubProfile | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("club_profiles")
    .select(PROFILE_SELECT)
    .eq("public_slug", slug.trim())
    .in("visibility", ["published", "hidden"])
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapQueryRow(data as ProfileQueryRow);
}
