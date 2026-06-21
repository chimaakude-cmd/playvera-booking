import type { PostgrestError } from "@supabase/supabase-js";
import type { ActivoraSupabaseClient } from "@/lib/supabase";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
  isSupabaseConfigured,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase";
import {
  mapClubProfileInputToLegacyRow,
  mapClubProfileInputToRow,
  mapClubProfileRowToProfile,
  mapLocationInputToRow,
} from "./db-mapper";
import { buildMinimalClubProfilesRowFromProvider } from "@/lib/club-onboarding/profile-mapper";
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
  return Boolean(row.public_slug?.trim());
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

function isUniqueProfileViolation(error: PostgrestError | null): boolean {
  return error?.code === "23505";
}

/** Create or upgrade a minimal public profile — no manual publish step. */
export async function ensureMinimalPublicClubProfileForProvider(
  supabase: ActivoraSupabaseClient,
  providerId: string,
): Promise<ClubProfile | null> {
  let profile = await fetchClubProfileForProvider(supabase, providerId);

  if (profile?.publicSlug?.trim()) {
    if (!profile.published || profile.visibility === "draft") {
      const publishedAt =
        profile.profileDesign?.publishedAt ?? new Date().toISOString();
      const { error } = await supabase
        .from("club_profiles")
        .update({
          published: true,
          visibility: "published",
          published_at: publishedAt,
        })
        .eq("provider_id", providerId);

      if (!error) {
        profile = await fetchClubProfileForProvider(supabase, providerId);
      }
    }

    return profile;
  }

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("name, slug, email, phone")
    .eq("id", providerId)
    .maybeSingle();

  if (providerError || !provider?.name?.trim()) {
    return profile ?? null;
  }

  const row = buildMinimalClubProfilesRowFromProvider(providerId, provider);
  const { error: insertError } = await supabase
    .from("club_profiles")
    .insert(row);

  if (insertError) {
    if (isUniqueProfileViolation(insertError)) {
      const { error: updateError } = await supabase
        .from("club_profiles")
        .update(row)
        .eq("provider_id", providerId);

      if (updateError) {
        console.error("[club-profile] ensure profile update failed:", updateError);
        return profile ?? null;
      }
    } else {
      console.error("[club-profile] ensure profile insert failed:", insertError);
      return profile ?? null;
    }
  }

  await supabase
    .from("providers")
    .update({ slug: row.public_slug })
    .eq("id", providerId);

  return fetchClubProfileForProvider(supabase, providerId);
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

const LEGACY_CLUB_PROFILE_COLUMNS = [
  "social_links",
  "contact",
  "verification_status",
  "visibility",
  "published_at",
] as const;

function isLegacyClubProfileSchemaError(error: PostgrestError): boolean {
  const message = error.message.toLowerCase();
  if (!message.includes("schema cache")) {
    return false;
  }

  return LEGACY_CLUB_PROFILE_COLUMNS.some((column) =>
    message.includes(column),
  );
}

function normalizePublishInput(
  input: ClubProfileInput,
  existingPublishedAt?: string | null,
): ClubProfileInput {
  const clubName = input.clubName.trim();
  const slug = input.publicSlug.trim() || slugifyClubName(clubName);

  if (!clubName || !slug) {
    return input;
  }

  return {
    ...input,
    publicSlug: slug,
    visibility: input.visibility === "hidden" ? "hidden" : "published",
    published: true,
    profileDesign: input.profileDesign
      ? {
          ...input.profileDesign,
          publishedAt:
            input.profileDesign.publishedAt ??
            existingPublishedAt ??
            new Date().toISOString(),
        }
      : input.profileDesign,
  };
}

async function persistClubProfileRow(
  supabase: ActivoraSupabaseClient,
  providerId: string,
  existingId: string | undefined,
  input: ClubProfileInput,
  profileId: string,
  existingPublishedAt?: string | null,
): Promise<PostgrestError | null> {
  const normalizedInput = normalizePublishInput(input, existingPublishedAt);
  const persistOptions = { existingPublishedAt };
  const slug =
    normalizedInput.publicSlug.trim() ||
    slugifyClubName(normalizedInput.clubName);

  const fullRow = mapClubProfileInputToRow(
    profileId,
    providerId,
    { ...normalizedInput, publicSlug: slug },
    persistOptions,
  );

  if (existingId) {
    const { error } = await supabase
      .from("club_profiles")
      .update(fullRow)
      .eq("provider_id", providerId);

    if (!error) {
      return null;
    }

    if (!isLegacyClubProfileSchemaError(error)) {
      return error;
    }

    const legacyRow = mapClubProfileInputToLegacyRow(
      profileId,
      providerId,
      { ...normalizedInput, publicSlug: slug },
      persistOptions,
    );
    const { error: legacyError } = await supabase
      .from("club_profiles")
      .update(legacyRow)
      .eq("provider_id", providerId);

    return legacyError;
  }

  const { error } = await supabase.from("club_profiles").insert(fullRow);
  if (!error) {
    return null;
  }

  if (!isLegacyClubProfileSchemaError(error)) {
    return error;
  }

  const legacyRow = mapClubProfileInputToLegacyRow(
    profileId,
    providerId,
    { ...normalizedInput, publicSlug: slug },
    persistOptions,
  );
  const { error: legacyError } = await supabase
    .from("club_profiles")
    .insert(legacyRow);

  return legacyError;
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
    .select("id, public_slug, published_at")
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

  const saveError = await persistClubProfileRow(
    supabase,
    providerId,
    existing?.id,
    { ...input, publicSlug: slug },
    profileId,
    existing?.published_at,
  );

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
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapQueryRow(data as ProfileQueryRow);
}
