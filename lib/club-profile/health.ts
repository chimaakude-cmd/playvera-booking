import { getPublicClubPath, slugifyClubName } from "./types";
import type { ClubProfile, ClubProfileVisibility } from "./types";

export type ClubProfileHealth = {
  isLive: boolean;
  slug: string | null;
  publicPath: string | null;
  reasons: string[];
  providerExists: boolean;
  publicProfileExists: boolean;
  slugSynced: boolean;
  publiclyResolvable: boolean;
};

export function normalizePublicSlug(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim().toLowerCase();
  return normalized || null;
}

/** Single canonical slug for dashboard, share, QR, and /clubs/[slug]. */
export function resolveCanonicalPublicSlug(input: {
  profilePublicSlug?: string | null;
  providerSlug?: string | null;
  clubName?: string | null;
}): string | null {
  return (
    normalizePublicSlug(input.profilePublicSlug) ??
    normalizePublicSlug(input.providerSlug) ??
    (input.clubName?.trim() ? slugifyClubName(input.clubName) : null)
  );
}

export function isPublishedVisibility(
  visibility?: ClubProfileVisibility | null,
  published?: boolean,
): boolean {
  if (visibility === "published" || visibility === "hidden") {
    return true;
  }

  if (visibility === "draft") {
    return false;
  }

  return Boolean(published);
}

export function isBlockedProviderLifecycle(
  lifecycleStatus?: string | null,
): boolean {
  const status = lifecycleStatus?.trim().toLowerCase();
  return status === "abandoned" || status === "deleted";
}

export function assessClubProfileHealth(input: {
  providerExists: boolean;
  providerSlug?: string | null;
  providerLifecycleStatus?: string | null;
  profile: Pick<
    ClubProfile,
    "publicSlug" | "visibility" | "published" | "clubName"
  > | null;
  publiclyResolvable?: boolean;
}): ClubProfileHealth {
  const reasons: string[] = [];
  const providerExists = input.providerExists;
  const publicProfileExists = Boolean(input.profile);

  if (!providerExists) {
    reasons.push("Provider record missing");
  }

  if (isBlockedProviderLifecycle(input.providerLifecycleStatus)) {
    reasons.push(
      `Provider is ${input.providerLifecycleStatus?.trim().toLowerCase()}`,
    );
  }

  if (!publicProfileExists) {
    reasons.push("Public profile missing");
  }

  const slug = resolveCanonicalPublicSlug({
    profilePublicSlug: input.profile?.publicSlug,
    providerSlug: input.providerSlug,
    clubName: input.profile?.clubName,
  });

  if (!slug) {
    reasons.push("Public slug missing");
  }

  const profileSlug = normalizePublicSlug(input.profile?.publicSlug);
  const providerSlug = normalizePublicSlug(input.providerSlug);
  const slugSynced =
    Boolean(slug) &&
    (!profileSlug || !providerSlug || profileSlug === providerSlug);

  if (profileSlug && providerSlug && profileSlug !== providerSlug) {
    reasons.push("Slug mismatch between provider and profile");
  }

  if (
    input.profile &&
    !isPublishedVisibility(input.profile.visibility, input.profile.published)
  ) {
    reasons.push("Profile not published");
  }

  const publiclyResolvable =
    input.publiclyResolvable ??
    (providerExists &&
      publicProfileExists &&
      Boolean(slug) &&
      slugSynced &&
      !isBlockedProviderLifecycle(input.providerLifecycleStatus) &&
      (!input.profile ||
        isPublishedVisibility(
          input.profile.visibility,
          input.profile.published,
        )));

  const isLive = reasons.length === 0 && publiclyResolvable;

  return {
    isLive,
    slug,
    publicPath: slug ? getPublicClubPath(slug) : null,
    reasons,
    providerExists,
    publicProfileExists,
    slugSynced,
    publiclyResolvable,
  };
}
