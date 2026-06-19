import { toPersistableImageUrl } from "@/lib/image-urls";
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
  email: string;
  phone: string;
  verified: boolean;
  published: boolean;
};

/** Minimum club_profiles row for onboarding submit — no contact/social_links jsonb. */
export function buildMinimalClubProfilesRow(
  providerId: string,
  state: Pick<ClubOnboardingState, "owner" | "club">,
): MinimalClubProfilesRow {
  return {
    provider_id: providerId,
    club_name: state.club.name.trim(),
    public_slug: slugifyClubName(state.club.name),
    email: state.owner.email.trim(),
    phone: state.owner.phone.trim(),
    verified: false,
    published: false,
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

export function buildClubProfileInput(state: ClubOnboardingState): ClubProfileInput {
  const defaults = createDefaultClubProfile();
  const slug = slugifyClubName(state.club.name);
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
    locations: defaults.locations,
    contact,
    socialLinks: createEmptySocialLinks(),
    branding: {
      ...DEFAULT_CLUB_BRANDING,
      primaryColor: state.profile.primaryColor,
      secondaryColor: DEFAULT_CLUB_BRANDING.secondaryColor,
    },
    customerView: DEFAULT_CLUB_CUSTOMER_VIEW,
    mediaGallery: defaults.mediaGallery,
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
