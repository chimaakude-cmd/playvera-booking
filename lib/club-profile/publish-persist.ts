import type { PostgrestError } from "@supabase/supabase-js";
import type { MinimalClubProfilesRow } from "@/lib/club-onboarding/profile-mapper";
import type { ActivoraSupabaseClient } from "@/lib/supabase";

const LEGACY_CLUB_PROFILE_COLUMNS = [
  "social_links",
  "contact",
  "verification_status",
  "visibility",
  "published_at",
] as const;

export function isLegacyClubProfileSchemaError(
  error: PostgrestError | null,
): boolean {
  const message = error?.message.toLowerCase() ?? "";
  if (!message.includes("schema cache")) {
    return false;
  }

  return LEGACY_CLUB_PROFILE_COLUMNS.some((column) =>
    message.includes(column),
  );
}

export type ClubProfilePublishUpdate = {
  publicSlug?: string | null;
  publishedAt?: string | null;
};

/** Publish a club profile — tries full row, then legacy schemas without visibility/published_at. */
export async function persistClubProfilePublishState(
  supabase: ActivoraSupabaseClient,
  providerId: string,
  update: ClubProfilePublishUpdate = {},
): Promise<{ ok: true } | { ok: false; error: string }> {
  const publishedAt = update.publishedAt ?? new Date().toISOString();
  const slug = update.publicSlug?.trim();

  const fullUpdate = {
    published: true,
    visibility: "published" as const,
    published_at: publishedAt,
    ...(slug ? { public_slug: slug } : {}),
  };

  const { error: fullError } = await supabase
    .from("club_profiles")
    .update(fullUpdate)
    .eq("provider_id", providerId);

  if (!fullError) {
    return { ok: true };
  }

  if (!isLegacyClubProfileSchemaError(fullError)) {
    return { ok: false, error: fullError.message };
  }

  const withoutPublishedAt = {
    published: true,
    visibility: "published" as const,
    ...(slug ? { public_slug: slug } : {}),
  };

  const { error: visibilityOnlyError } = await supabase
    .from("club_profiles")
    .update(withoutPublishedAt)
    .eq("provider_id", providerId);

  if (!visibilityOnlyError) {
    return { ok: true };
  }

  if (!isLegacyClubProfileSchemaError(visibilityOnlyError)) {
    return { ok: false, error: visibilityOnlyError.message };
  }

  const publishedOnly = {
    published: true,
    ...(slug ? { public_slug: slug } : {}),
  };

  const { error: legacyError } = await supabase
    .from("club_profiles")
    .update(publishedOnly)
    .eq("provider_id", providerId);

  if (legacyError) {
    return { ok: false, error: legacyError.message };
  }

  return { ok: true };
}

/** Insert minimal profile row — falls back when visibility/published_at columns are absent. */
export async function insertMinimalClubProfileRow(
  supabase: ActivoraSupabaseClient,
  row: MinimalClubProfilesRow,
): Promise<{ ok: true } | { ok: false; error: PostgrestError }> {
  const { error } = await supabase.from("club_profiles").insert(row);

  if (!error) {
    return { ok: true };
  }

  if (!isLegacyClubProfileSchemaError(error)) {
    return { ok: false, error };
  }

  const { visibility: _visibility, published_at: _publishedAt, ...legacyRow } =
    row;

  const { error: legacyError } = await supabase
    .from("club_profiles")
    .insert(legacyRow);

  if (legacyError) {
    return { ok: false, error: legacyError };
  }

  return { ok: true };
}

/** Restore provider lifecycle so public slug resolution is not blocked. */
export async function restoreProviderLifecycleForPublicProfile(
  supabase: ActivoraSupabaseClient,
  providerId: string,
): Promise<void> {
  const { data: provider, error } = await supabase
    .from("providers")
    .select(
      "lifecycle_status, deleted_at, onboarding_completed, auth_user_id, account_status",
    )
    .eq("id", providerId)
    .maybeSingle();

  if (error || !provider?.auth_user_id) {
    return;
  }

  const lifecycle = provider.lifecycle_status?.trim().toLowerCase();
  const needsRestore =
    lifecycle === "abandoned" ||
    lifecycle === "deleted" ||
    provider.deleted_at != null ||
    provider.onboarding_completed === false;

  if (!needsRestore) {
    return;
  }

  const { error: activateError } = await supabase
    .from("providers")
    .update({
      lifecycle_status: "active",
      onboarding_completed: true,
      deleted_at: null,
      account_status: provider.account_status?.trim() || "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", providerId);

  if (activateError && !activateError.message.includes("lifecycle_status")) {
    await supabase
      .from("providers")
      .update({
        onboarding_completed: true,
        deleted_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", providerId);
  }
}
