/**
 * Club Profile — source of truth for customer-facing club pages.
 *
 * Storage: Supabase `public.club_profiles` + `public.club_profile_locations`
 * Cache: localStorage key `activora-club-profile` (read-through cache only)
 */

export type ClubProfileVisibility = "draft" | "published" | "hidden";

export type ClubProfileMediaType = "photo" | "video" | "highlight";

export type ClubProfileButtonStyle = "rounded" | "pill" | "square";

export type ClubProfileCardStyle = "soft" | "bordered" | "elevated";

export type ClubProfileFontPreset = "modern" | "friendly" | "classic";

export type ClubVerificationStatus =
  | "unverified"
  | "verified"
  | "premium_verified";

export type ClubSocialPlatform =
  | "instagram"
  | "facebook"
  | "linkedin"
  | "x"
  | "tiktok"
  | "youtube"
  | "threads"
  | "snapchat"
  | "pinterest"
  | "website";

export type ClubProfileContact = {
  email: string;
  phone: string;
  whatsapp: string;
  website: string;
};

export type ClubSocialLinks = Record<ClubSocialPlatform, string>;

export type ClubProfileMediaItem = {
  id: string;
  type: ClubProfileMediaType;
  url: string;
  caption: string;
  sortOrder: number;
};

export type ClubProfileLocation = {
  id: string;
  venueName: string;
  addressLine1: string;
  addressLine2: string;
  townCity: string;
  postcode: string;
  latitude: number;
  longitude: number;
  radiusMiles: number;
  isMain: boolean;
};

export type ClubProfileBranding = {
  primaryColor: string;
  secondaryColor: string;
  buttonStyle: ClubProfileButtonStyle;
  cardStyle: ClubProfileCardStyle;
  fontPreset: ClubProfileFontPreset;
};

export type ClubProfileCustomerView = {
  showTeam: boolean;
  showTestimonials: boolean;
  showMap: boolean;
  showSocialLinks: boolean;
  showAgeRanges: boolean;
  showGallery: boolean;
};

export type ClubProfileStyle =
  | "modern"
  | "family"
  | "professional"
  | "energetic"
  | "luxury";

export type ClubThemePreset =
  | "professional"
  | "sports"
  | "playful"
  | "minimal"
  | "premium";

export type ClubProfileTrustSignals = {
  verified: boolean;
  dbs: boolean;
  ofsted: boolean;
  insurance: boolean;
  yearsRunning: boolean;
  avgReview: boolean;
};

export type ClubProfileDesignSettings = {
  publicVisible: boolean;
  searchIndexing: boolean;
  showReviews: boolean;
  allowMessaging: boolean;
};

export type ClubProfileDesign = {
  logoUrl: string | null;
  coverUrl: string | null;
  primaryColor: string;
  accentColor: string;
  themePreset: ClubThemePreset | null;
  tagline: string;
  aboutText: string;
  whatMakesSpecial: string;
  profileStyle: ClubProfileStyle;
  trustSignals: ClubProfileTrustSignals;
  settings: ClubProfileDesignSettings;
  publishedAt: string | null;
  skipped?: boolean;
};

export type ClubProfile = {
  id: string;
  providerId: string;

  logoUrl: string | null;
  coverImageUrl: string | null;
  clubName: string;
  tagline: string;
  shortDescription: string;
  establishedYear: number | null;
  verificationStatus: ClubVerificationStatus;

  longDescription: string;
  uniqueSellingPoints: string;
  categories: string[];
  ageRanges: string[];
  accessibilityOptions: string[];

  locations: ClubProfileLocation[];

  contact: ClubProfileContact;
  socialLinks: ClubSocialLinks;

  branding: ClubProfileBranding;
  customerView: ClubProfileCustomerView;
  mediaGallery: ClubProfileMediaItem[];

  publicSlug: string;
  metaTitle: string;
  metaDescription: string;
  published: boolean;
  visibility: ClubProfileVisibility;

  profileDesign?: ClubProfileDesign;

  createdAt: string;
  updatedAt: string;
};

export type ClubProfileInput = Omit<
  ClubProfile,
  "id" | "providerId" | "createdAt" | "updatedAt"
>;

export const CLUB_PROFILE_STORAGE_KEY = "activora-club-profile";

export const CLUB_SOCIAL_PLATFORMS: ClubSocialPlatform[] = [
  "instagram",
  "facebook",
  "linkedin",
  "x",
  "tiktok",
  "youtube",
  "threads",
  "snapchat",
  "pinterest",
  "website",
];

export const CLUB_CATEGORY_OPTIONS = [
  "Sports",
  "Arts & crafts",
  "Music",
  "Dance",
  "STEM",
  "Holiday camps",
  "After-school clubs",
  "Performing arts",
] as const;

export const CLUB_AGE_RANGE_OPTIONS = [
  "0–2 years",
  "3–5 years",
  "6–8 years",
  "9–11 years",
  "12–14 years",
  "15+ years",
] as const;

export const CLUB_ACCESSIBILITY_OPTIONS = [
  "Wheelchair access",
  "Step-free entry",
  "Accessible toilets",
  "Quiet spaces",
  "Visual guides",
  "BSL support",
  "SEN-friendly sessions",
] as const;

export const verificationStatusLabels: Record<ClubVerificationStatus, string> =
  {
    unverified: "Unverified",
    verified: "Verified",
    premium_verified: "Premium verified",
  };

export const socialPlatformLabels: Record<ClubSocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  x: "X (Twitter)",
  tiktok: "TikTok",
  youtube: "YouTube",
  threads: "Threads",
  snapchat: "Snapchat",
  pinterest: "Pinterest",
  website: "Website",
};

export const socialPlatformPlaceholders: Record<ClubSocialPlatform, string> = {
  instagram: "https://instagram.com/playvera",
  facebook: "https://facebook.com/playvera",
  linkedin: "https://linkedin.com/company/playvera",
  x: "https://x.com/playvera",
  tiktok: "https://tiktok.com/@playvera",
  youtube: "https://youtube.com/@playvera",
  threads: "https://threads.net/@playvera",
  snapchat: "https://snapchat.com/add/playvera",
  pinterest: "https://pinterest.com/playvera",
  website: "https://playvera.com",
};

export const buttonStyleLabels: Record<ClubProfileButtonStyle, string> = {
  rounded: "Rounded",
  pill: "Pill",
  square: "Square",
};

export const cardStyleLabels: Record<ClubProfileCardStyle, string> = {
  soft: "Soft shadow",
  bordered: "Bordered",
  elevated: "Elevated",
};

export const fontPresetLabels: Record<ClubProfileFontPreset, string> = {
  modern: "Modern sans",
  friendly: "Friendly rounded",
  classic: "Classic serif",
};

export function createEmptySocialLinks(): ClubSocialLinks {
  return {
    instagram: "",
    facebook: "",
    linkedin: "",
    x: "",
    tiktok: "",
    youtube: "",
    threads: "",
    snapchat: "",
    pinterest: "",
    website: "",
  };
}

export function createEmptyContact(): ClubProfileContact {
  return {
    email: "",
    phone: "",
    whatsapp: "",
    website: "",
  };
}

export function slugifyClubName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatClubAddress(location: ClubProfileLocation): string {
  return [
    location.addressLine1,
    location.addressLine2,
    location.townCity,
    location.postcode,
  ]
    .filter(Boolean)
    .join(", ");
}

export function getMainClubLocation(
  profile: ClubProfile,
): ClubProfileLocation | null {
  return (
    profile.locations.find((location) => location.isMain) ??
    profile.locations[0] ??
    null
  );
}

export function getPublicClubPath(slug: string): string {
  return `/clubs/${slug}`;
}

export const clubProfileVisibilityLabels: Record<ClubProfileVisibility, string> =
  {
    draft: "Draft — only visible to your team",
    published: "Published — public on activora.uk",
    hidden: "Hidden — direct link only",
  };

export function isPubliclyAccessibleProfile(profile: {
  visibility?: ClubProfileVisibility;
  published?: boolean;
}): boolean {
  if (profile.visibility) {
    return profile.visibility === "published" || profile.visibility === "hidden";
  }

  return Boolean(profile.published);
}

/** @deprecated Legacy flat profile fields — used only when migrating localStorage. */
export type LegacyClubProfileFields = {
  verified?: boolean;
  website?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  whatsapp?: string;
  email?: string;
  phone?: string;
};
