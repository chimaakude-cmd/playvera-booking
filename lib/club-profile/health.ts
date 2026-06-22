import { getPublicClubPath, slugifyClubName } from "./types";
import type { ClubProfile, ClubProfileVisibility } from "./types";

export type ClubProfileHealth = {
  isLive: boolean;
  slug: string | null;
  publicPath: string | null;
  /** Blocking issues that prevent the public page from loading. */
  reasons: string[];
  /** Non-blocking content gaps — profile may still be live. */
  readinessGaps: string[];
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

export function assessClubProfileReadinessGaps(input: {
  profile: Pick<
    ClubProfile,
    "publicSlug" | "visibility" | "published" | "clubName"
  > &
    Partial<
      Pick<
        ClubProfile,
        | "logoUrl"
        | "shortDescription"
        | "longDescription"
        | "categories"
        | "profileDesign"
      >
    > | null;
  providerOnboardingCompleted?: boolean | null;
  publishedActivityCount?: number;
}): string[] {
  const gaps: string[] = [];
  const profile = input.profile;

  if (!profile) {
    return gaps;
  }

  const hasLogo = Boolean(
    profile.logoUrl?.trim() || profile.profileDesign?.logoUrl?.trim(),
  );
  if (!hasLogo) {
    gaps.push("Logo missing");
  }

  const description =
    profile.shortDescription?.trim() ||
    profile.longDescription?.trim() ||
    profile.profileDesign?.aboutText?.trim();
  if (!description) {
    gaps.push("Description missing");
  }

  if (profile.categories !== undefined && profile.categories.length === 0) {
    gaps.push("Categories missing");
  }

  if (
    typeof input.publishedActivityCount === "number" &&
    input.publishedActivityCount === 0
  ) {
    gaps.push("No published activities");
  }

  if (input.providerOnboardingCompleted === false) {
    gaps.push("Onboarding incomplete");
  }

  return gaps;
}

export function assessClubProfileHealth(input: {
  providerExists: boolean;
  providerSlug?: string | null;
  providerLifecycleStatus?: string | null;
  providerOnboardingCompleted?: boolean | null;
  providerDeletedAt?: string | null;
  publishedActivityCount?: number;
  profile: Pick<
    ClubProfile,
    "publicSlug" | "visibility" | "published" | "clubName"
  > &
    Partial<
      Pick<
        ClubProfile,
        | "logoUrl"
        | "shortDescription"
        | "longDescription"
        | "categories"
        | "profileDesign"
      >
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

  if (input.providerDeletedAt) {
    reasons.push("Provider is deleted");
  }

  if (input.providerOnboardingCompleted === false) {
    reasons.push("Onboarding incomplete");
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

  if (input.profile) {
    if (
      !isPublishedVisibility(input.profile.visibility, input.profile.published)
    ) {
      reasons.push(
        input.profile.visibility === "draft"
          ? "Profile visibility is draft"
          : "Profile not published",
      );
    }
  }

  const publiclyResolvable =
    input.publiclyResolvable ??
    (providerExists &&
      publicProfileExists &&
      Boolean(slug) &&
      slugSynced &&
      !isBlockedProviderLifecycle(input.providerLifecycleStatus) &&
      !input.providerDeletedAt &&
      (!input.profile ||
        isPublishedVisibility(
          input.profile.visibility,
          input.profile.published,
        )));

  const readinessGaps = assessClubProfileReadinessGaps({
    profile: input.profile,
    providerOnboardingCompleted: input.providerOnboardingCompleted,
    publishedActivityCount: input.publishedActivityCount,
  }).filter((gap) => {
    if (gap === "Onboarding incomplete") {
      return input.providerOnboardingCompleted === false;
    }
    if (gap === "No published activities") {
      return typeof input.publishedActivityCount === "number";
    }
    return true;
  });

  const isLive = reasons.length === 0 && publiclyResolvable;

  return {
    isLive,
    slug,
    publicPath: slug ? getPublicClubPath(slug) : null,
    reasons,
    readinessGaps,
    providerExists,
    publicProfileExists,
    slugSynced,
    publiclyResolvable,
  };
}
