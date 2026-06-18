import { toPersistableImageUrl } from "@/lib/image-urls";
import { createDefaultClubProfile, migrateLegacyClubProfile } from "./defaults";
import {
  normalizeClubContact,
  normalizeClubSocialLinks,
} from "./links";
import type {
  ClubProfile,
  ClubProfileInput,
  LegacyClubProfileFields,
} from "./types";
import { CLUB_PROFILE_STORAGE_KEY } from "./types";

export const CLUB_PROFILE_SAVE_QUOTA_MESSAGE =
  "Your club profile could not be fully saved locally because browser storage is full. Text details were saved where possible — you can add images later from settings.";

function isStorageQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}

/** Strip base64/data URLs from all image fields before persisting or after load. */
export function sanitizeClubProfileImages<
  T extends Pick<
    ClubProfile,
    "logoUrl" | "coverImageUrl" | "profileDesign" | "mediaGallery"
  >,
>(profile: T): T {
  const profileDesign = profile.profileDesign
    ? {
        ...profile.profileDesign,
        logoUrl: toPersistableImageUrl(profile.profileDesign.logoUrl),
        coverUrl: toPersistableImageUrl(profile.profileDesign.coverUrl),
      }
    : profile.profileDesign;

  return {
    ...profile,
    logoUrl: toPersistableImageUrl(profile.logoUrl),
    coverImageUrl: toPersistableImageUrl(profile.coverImageUrl),
    profileDesign,
    mediaGallery: profile.mediaGallery.map((item) => ({
      ...item,
      url: toPersistableImageUrl(item.url) ?? "",
    })),
  };
}

function normalizeProfile(
  raw: Partial<ClubProfile> & LegacyClubProfileFields,
): ClubProfile {
  const defaults = createDefaultClubProfile();
  const migrated = migrateLegacyClubProfile(raw);

  const profile: ClubProfile = {
    ...defaults,
    ...raw,
    ...migrated,
    branding: { ...defaults.branding, ...raw.branding },
    customerView: { ...defaults.customerView, ...raw.customerView },
    contact: {
      ...defaults.contact,
      ...migrated.contact,
      ...raw.contact,
    },
    socialLinks: {
      ...defaults.socialLinks,
      ...migrated.socialLinks,
      ...raw.socialLinks,
    },
    categories: raw.categories ?? defaults.categories,
    ageRanges: raw.ageRanges ?? defaults.ageRanges,
    accessibilityOptions:
      raw.accessibilityOptions ?? defaults.accessibilityOptions,
    locations: raw.locations?.length ? raw.locations : defaults.locations,
    mediaGallery: raw.mediaGallery ?? defaults.mediaGallery,
    profileDesign: raw.profileDesign ?? defaults.profileDesign,
    establishedYear:
      raw.establishedYear === undefined
        ? defaults.establishedYear
        : raw.establishedYear,
  };

  const { contact } = normalizeClubContact(profile.contact);
  const { socialLinks } = normalizeClubSocialLinks(profile.socialLinks);

  return sanitizeClubProfileImages({
    ...profile,
    contact,
    socialLinks,
  });
}

export function getClubProfile(): ClubProfile {
  if (typeof window === "undefined") {
    return createDefaultClubProfile();
  }

  try {
    const raw = localStorage.getItem(CLUB_PROFILE_STORAGE_KEY);
    if (!raw) {
      return createDefaultClubProfile();
    }

    return normalizeProfile(JSON.parse(raw) as Partial<ClubProfile>);
  } catch {
    return createDefaultClubProfile();
  }
}

export function saveClubProfile(
  input: ClubProfileInput,
  options?: { providerId?: string },
): ClubProfile {
  const existing = getClubProfile();
  const now = new Date().toISOString();

  const { contact, errors: contactErrors } = normalizeClubContact(input.contact);
  const { socialLinks, errors: socialErrors } = normalizeClubSocialLinks(
    input.socialLinks,
  );

  const validationErrors = { ...contactErrors, ...socialErrors };
  if (Object.keys(validationErrors).length > 0) {
    throw new Error("Fix contact and social link errors before saving.");
  }

  if (!contact.email.trim()) {
    throw new Error("Email is required.");
  }

  const profile = sanitizeClubProfileImages({
    ...existing,
    ...input,
    providerId: options?.providerId?.trim() || existing.providerId,
    contact,
    socialLinks,
    updatedAt: now,
    createdAt: existing.createdAt || now,
  });

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CLUB_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
      if (isStorageQuotaError(error)) {
        throw new Error(CLUB_PROFILE_SAVE_QUOTA_MESSAGE);
      }
      throw error;
    }
  }

  return profile;
}

export function getClubProfileBySlug(slug: string): ClubProfile | null {
  const profile = getClubProfile();
  if (profile.publicSlug !== slug || !profile.published) {
    return null;
  }

  return profile;
}

export function validateClubProfileInput(input: ClubProfileInput): {
  contactErrors: Partial<Record<keyof ClubProfileInput["contact"], string>>;
  socialErrors: Partial<Record<keyof ClubProfileInput["socialLinks"], string>>;
  isValid: boolean;
} {
  const { errors: contactErrors } = normalizeClubContact(input.contact);
  const { errors: socialErrors } = normalizeClubSocialLinks(input.socialLinks);

  const isValid =
    !input.contact.email.trim()
      ? false
      : Object.keys({ ...contactErrors, ...socialErrors }).length === 0;

  return {
    contactErrors,
    socialErrors,
    isValid: isValid && Boolean(input.contact.email.trim()),
  };
}
