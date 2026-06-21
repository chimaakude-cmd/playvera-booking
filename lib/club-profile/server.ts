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
import {
  assessClubProfileHealth,
  isPublishedVisibility,
  normalizePublicSlug,
  resolveCanonicalPublicSlug,
  type ClubProfileHealth,
} from "./health";
import type { ClubProfile, ClubProfileInput } from "./types";
import { slugifyClubName } from "./types";

export type { ClubProfileHealth } from "./health";
export { assessClubProfileHealth, resolveCanonicalPublicSlug } from "./health";

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

const UUID_SLUG_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isProviderIdSlug(slug: string): boolean {
  return UUID_SLUG_PATTERN.test(slug.trim());
}

function profileLookupClients(): ActivoraSupabaseClient[] {
  const clients: ActivoraSupabaseClient[] = [createSupabaseServerClient()];
  if (isSupabaseServiceRoleConfigured()) {
    clients.push(createSupabaseServiceRoleClient());
  }
  return clients;
}

function serviceRoleClientOrNull(): ActivoraSupabaseClient | null {
  if (!isSupabaseServiceRoleConfigured()) {
    return null;
  }
  return createSupabaseServiceRoleClient();
}

async function syncProviderPublicSlug(
  supabase: ActivoraSupabaseClient,
  providerId: string,
  publicSlug: string,
): Promise<void> {
  const slug = normalizePublicSlug(publicSlug);
  if (!slug) {
    return;
  }

  await supabase.from("providers").update({ slug }).eq("id", providerId);
}

async function syncCanonicalPublicSlug(
  supabase: ActivoraSupabaseClient,
  providerId: string,
  canonicalSlug: string,
): Promise<void> {
  const slug = normalizePublicSlug(canonicalSlug);
  if (!slug) {
    return;
  }

  await supabase
    .from("club_profiles")
    .update({ public_slug: slug })
    .eq("provider_id", providerId);

  await syncProviderPublicSlug(supabase, providerId, slug);
}

async function findProviderForPublicSlugLookup(
  supabase: ActivoraSupabaseClient,
  slug: string,
): Promise<{
  id: string;
  name: string;
  slug: string | null;
  email: string | null;
  phone: string | null;
} | null> {
  const normalizedSlug = slug.trim().toLowerCase();

  const { data: bySlug, error: slugError } = await supabase
    .from("providers")
    .select("id, name, slug, email, phone")
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (!slugError && bySlug?.id) {
    return bySlug;
  }

  if (isProviderIdSlug(normalizedSlug)) {
    const { data: byId, error: idError } = await supabase
      .from("providers")
      .select("id, name, slug, email, phone")
      .eq("id", normalizedSlug)
      .maybeSingle();

    if (!idError && byId?.id) {
      return byId;
    }
  }

  return null;
}

export async function fetchPublicClubProfileBySlug(
  slug: string,
): Promise<ClubProfile | null> {
  const normalizedSlug = slug.trim().toLowerCase();
  if (!normalizedSlug || !isSupabaseConfigured()) {
    return null;
  }

  for (const supabase of profileLookupClients()) {
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

  return ensurePublicClubProfileForSlugLookup(normalizedSlug);
}

/** Auto-create or repair a public profile when a real provider matches the slug. */
async function ensurePublicClubProfileForSlugLookup(
  slug: string,
): Promise<ClubProfile | null> {
  const repairClient = serviceRoleClientOrNull() ?? createSupabaseServerClient();
  const provider = await findProviderForPublicSlugLookup(repairClient, slug);
  if (!provider?.id) {
    return null;
  }

  const profile = await ensureMinimalPublicClubProfileForProvider(
    repairClient,
    provider.id,
  );
  if (!profile?.publicSlug?.trim()) {
    return null;
  }

  return profile;
}

function isPublicClubProfileRow(
  row: Pick<
    ProfileQueryRow,
    "visibility" | "published" | "public_slug"
  >,
): boolean {
  return (
    Boolean(normalizePublicSlug(row.public_slug)) &&
    isPublishedVisibility(row.visibility, row.published)
  );
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

async function upgradeProfileToPublic(
  supabase: ActivoraSupabaseClient,
  providerId: string,
  profile: ClubProfile,
): Promise<ClubProfile> {
  if (profile.published && profile.visibility !== "draft") {
    return profile;
  }

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

  if (error) {
    console.error("[club-profile] publish upgrade failed:", error);
    return profile;
  }

  return (await fetchClubProfileForProvider(supabase, providerId)) ?? profile;
}

/** Create or upgrade a minimal public profile — no manual publish step. */
export async function ensureMinimalPublicClubProfileForProvider(
  supabase: ActivoraSupabaseClient,
  providerId: string,
): Promise<ClubProfile | null> {
  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("name, slug, email, phone, lifecycle_status")
    .eq("id", providerId)
    .maybeSingle();

  if (providerError || !provider?.name?.trim()) {
    return null;
  }

  const canonicalSlug = resolveCanonicalPublicSlug({
    profilePublicSlug: null,
    providerSlug: provider.slug,
    clubName: provider.name,
  });

  if (!canonicalSlug) {
    return null;
  }

  let profile = await fetchClubProfileForProvider(supabase, providerId);

  if (profile) {
    const profileSlug = normalizePublicSlug(profile.publicSlug);
    const providerSlug = normalizePublicSlug(provider.slug);

    if (!profileSlug || profileSlug !== canonicalSlug || providerSlug !== canonicalSlug) {
      const { error: slugSyncError } = await supabase
        .from("club_profiles")
        .update({ public_slug: canonicalSlug })
        .eq("provider_id", providerId);

      if (slugSyncError) {
        console.error("[club-profile] slug sync failed:", slugSyncError);
      }
    }

    profile = await fetchClubProfileForProvider(supabase, providerId);
    if (!profile) {
      return null;
    }

    profile = await upgradeProfileToPublic(supabase, providerId, profile);
    await syncCanonicalPublicSlug(supabase, providerId, canonicalSlug);
    return profile;
  }

  const row = buildMinimalClubProfilesRowFromProvider(providerId, {
    ...provider,
    slug: canonicalSlug,
  });

  const { error: insertError } = await supabase.from("club_profiles").insert(row);

  if (insertError) {
    if (isUniqueProfileViolation(insertError)) {
      const { error: updateError } = await supabase
        .from("club_profiles")
        .update(row)
        .eq("provider_id", providerId);

      if (updateError) {
        console.error("[club-profile] ensure profile update failed:", updateError);
        return null;
      }
    } else {
      console.error("[club-profile] ensure profile insert failed:", insertError);
      return null;
    }
  }

  await syncCanonicalPublicSlug(supabase, providerId, canonicalSlug);

  profile = await fetchClubProfileForProvider(supabase, providerId);
  if (!profile) {
    return null;
  }

  return upgradeProfileToPublic(supabase, providerId, profile);
}

export async function getClubProfileHealthForProvider(
  supabase: ActivoraSupabaseClient,
  providerId: string,
): Promise<ClubProfileHealth | null> {
  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id, name, slug, lifecycle_status")
    .eq("id", providerId)
    .maybeSingle();

  if (providerError || !provider?.id) {
    return null;
  }

  const profile = await fetchClubProfileForProvider(supabase, providerId);
  let publiclyResolvable = false;

  const canonicalSlug = resolveCanonicalPublicSlug({
    profilePublicSlug: profile?.publicSlug,
    providerSlug: provider.slug,
    clubName: profile?.clubName ?? provider.name,
  });

  if (canonicalSlug) {
    publiclyResolvable = await canResolvePublicClubProfileSlug(canonicalSlug);
  }

  return assessClubProfileHealth({
    providerExists: true,
    providerSlug: provider.slug,
    providerLifecycleStatus: provider.lifecycle_status,
    profile,
    publiclyResolvable,
  });
}

export async function repairPublicClubProfileForProvider(
  supabase: ActivoraSupabaseClient,
  providerId: string,
): Promise<
  | { ok: true; profile: ClubProfile; health: ClubProfileHealth }
  | { ok: false; error: string }
> {
  const repairClient = serviceRoleClientOrNull() ?? supabase;
  const profile = await ensureMinimalPublicClubProfileForProvider(
    repairClient,
    providerId,
  );

  if (!profile) {
    return { ok: false, error: "Could not repair club profile." };
  }

  const health = await getClubProfileHealthForProvider(repairClient, providerId);
  if (!health) {
    return { ok: false, error: "Could not verify club profile health." };
  }

  return { ok: true, profile, health };
}

async function fetchPublicClubProfileByProviderSlug(
  supabase: ActivoraSupabaseClient,
  slug: string,
  options?: { allowRepair?: boolean },
): Promise<ClubProfile | null> {
  const provider = await findProviderForPublicSlugLookup(supabase, slug);
  if (!provider?.id) {
    return null;
  }

  const existing = await queryPublicClubProfile(supabase, (query) =>
    query.eq("provider_id", provider.id),
  );
  if (existing) {
    return existing;
  }

  if (options?.allowRepair === false) {
    return null;
  }

  if (!isSupabaseServiceRoleConfigured()) {
    return null;
  }

  const serviceClient = createSupabaseServiceRoleClient();
  return ensureMinimalPublicClubProfileForProvider(serviceClient, provider.id);
}

async function canResolvePublicClubProfileSlug(slug: string): Promise<boolean> {
  const normalizedSlug = normalizePublicSlug(slug);
  if (!normalizedSlug || !isSupabaseConfigured()) {
    return false;
  }

  for (const supabase of profileLookupClients()) {
    const byPublicSlug = await queryPublicClubProfile(supabase, (query) =>
      query.eq("public_slug", normalizedSlug),
    );
    if (byPublicSlug) {
      return true;
    }

    const byProviderSlug = await fetchPublicClubProfileByProviderSlug(
      supabase,
      normalizedSlug,
      { allowRepair: false },
    );
    if (byProviderSlug) {
      return true;
    }
  }

  return false;
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
    await syncCanonicalPublicSlug(supabase, providerId, slug);
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
