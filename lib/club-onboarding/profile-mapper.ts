import { toPersistableImageUrl } from "@/lib/image-urls";
import { isDevelopmentEnvironment } from "@/lib/admin-users/production-gates";
import {
  createDefaultClubProfile,
  DEFAULT_CLUB_BRANDING,
  DEFAULT_CLUB_CUSTOMER_VIEW,
} from "@/lib/club-profile/defaults";
import type { ClubProfileInput } from "@/lib/club-profile/types";
import {
  createEmptyContact,
  createEmptySocialLinks,
  slugifyClubName,
} from "@/lib/club-profile/types";
import type { ClubOnboardingState, OnboardingProfile } from "./types";
import { getClubCategories } from "./types";

/** Columns from base club_profiles schema (00008) — safe for production without 00009 jsonb fields. */
export type MinimalClubProfilesRow = {
  provider_id: string;
  club_name: string;
  public_slug: string;
  tagline: string;
  short_description: string;
  long_description: string;
  meta_title: string;
  meta_description: string;
  categories: string[];
  age_ranges: string[];
  email: string;
  phone: string;
  verified: boolean;
  published: boolean;
  visibility: "published";
  published_at: string;
};

function buildOnboardingDescriptionFallbacks(
  state: Pick<ClubOnboardingState, "club">,
): { tagline: string; description: string } {
  const clubName = state.club.name.trim();
  const tagline =
    state.club.suggestedTagline.trim() ||
    `Activities and clubs with ${clubName}`;
  const description =
    state.club.suggestedDescription.trim() ||
    `${clubName} offers children's activities and clubs. Book sessions and find out more on our public profile.`;

  return { tagline, description };
}

/** Minimum club_profiles row for onboarding submit — auto-published with available data. */
export function buildMinimalClubProfilesRow(
  providerId: string,
  publicSlug: string,
  state: Pick<ClubOnboardingState, "owner" | "club">,
): MinimalClubProfilesRow {
  const clubName = state.club.name.trim();
  const slug = publicSlug.trim() || slugifyClubName(clubName);
  const { tagline, description } = buildOnboardingDescriptionFallbacks(state);

  return {
    provider_id: providerId,
    club_name: clubName,
    public_slug: slug,
    tagline,
    short_description: description.slice(0, 200),
    long_description: description,
    meta_title: `${clubName} | Activeora`,
    meta_description: tagline,
    categories: getClubCategories(state.club),
    age_ranges: state.club.ageRanges,
    email: state.owner.email.trim(),
    phone: state.owner.phone.trim(),
    verified: false,
    published: true,
    visibility: "published",
    published_at: new Date().toISOString(),
  };
}

/** Strip base64/data URLs — only lightweight http(s) URLs may be persisted. */
export function stripImageDataUrls(
  profile: OnboardingProfile,
): OnboardingProfile {
  return {
    ...profile,
    logoUrl: toPersistableImageUrl(profile.logoUrl),
    coverUrl: toPersistableImageUrl(profile.coverUrl),
  };
}

export function buildClubProfileInput(
  state: ClubOnboardingState,
  options?: { publicSlug?: string },
): ClubProfileInput {
  const defaults = createDefaultClubProfile();
  const slug = options?.publicSlug?.trim() || slugifyClubName(state.club.name);
  const aboutText =
    state.profile.aboutText.trim() || state.club.suggestedDescription.trim();
  const tagline =
    state.profile.tagline.trim() || state.club.suggestedTagline.trim();
  const persistedProfile = stripImageDataUrls(state.profile);
  const logoUrl = persistedProfile.logoUrl;
  const coverUrl = persistedProfile.coverUrl;

  const contact = {
    ...createEmptyContact(),
    email: state.owner.email.trim(),
    phone: state.owner.phone.trim(),
  };

  return {
    logoUrl,
    coverImageUrl: coverUrl,
    clubName: state.club.name.trim(),
    tagline,
    shortDescription: aboutText.slice(0, 200),
    establishedYear: null,
    verificationStatus: "unverified",
    longDescription: aboutText,
    uniqueSellingPoints: "",
    categories: getClubCategories(state.club),
    ageRanges: state.club.ageRanges,
    accessibilityOptions: defaults.accessibilityOptions,
    locations: isDevelopmentEnvironment() ? defaults.locations : [],
    contact,
    socialLinks: createEmptySocialLinks(),
    branding: {
      ...DEFAULT_CLUB_BRANDING,
      primaryColor: state.profile.primaryColor,
      secondaryColor: DEFAULT_CLUB_BRANDING.secondaryColor,
    },
    customerView: DEFAULT_CLUB_CUSTOMER_VIEW,
    mediaGallery: isDevelopmentEnvironment() ? defaults.mediaGallery : [],
    publicSlug: slug,
    metaTitle: `${state.club.name.trim()} | Activeora`,
    metaDescription: tagline,
    published: true,
    visibility: "published",
    profileDesign: {
      logoUrl,
      coverUrl,
      primaryColor: state.profile.primaryColor,
      accentColor: DEFAULT_CLUB_BRANDING.secondaryColor,
      themePreset: null,
      tagline,
      aboutText,
      whatMakesSpecial: "",
      profileStyle: "modern",
      trustSignals: {
        verified: false,
        dbs: false,
        ofsted: false,
        insurance: false,
        yearsRunning: false,
        avgReview: false,
      },
      settings: {
        publicVisible: true,
        searchIndexing: true,
        showReviews: true,
        allowMessaging: true,
      },
      publishedAt: new Date().toISOString(),
      skipped: state.profile.skippedProfile,
    },
  };
}
