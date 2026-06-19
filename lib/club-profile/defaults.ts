import type {
  ClubProfile,
  ClubProfileBranding,
  ClubProfileContact,
  ClubProfileCustomerView,
  ClubProfileLocation,
  ClubProfileMediaItem,
  ClubSocialLinks,
  LegacyClubProfileFields,
} from "./types";
import {
  createEmptyContact,
  createEmptySocialLinks,
} from "./types";
import { normalizeClubContact, normalizeClubSocialLinks } from "./links";

export const DEFAULT_CLUB_BRANDING: ClubProfileBranding = {
  primaryColor: "#0d9488",
  secondaryColor: "#7c3aed",
  buttonStyle: "rounded",
  cardStyle: "soft",
  fontPreset: "modern",
};

export const DEFAULT_CLUB_CUSTOMER_VIEW: ClubProfileCustomerView = {
  showTeam: true,
  showTestimonials: true,
  showMap: true,
  showSocialLinks: true,
  showAgeRanges: true,
  showGallery: true,
};

export const DEFAULT_CLUB_LOCATIONS: ClubProfileLocation[] = [
  {
    id: "demo-venue-1",
    venueName: "Riverside Community Centre",
    addressLine1: "12 River Lane",
    addressLine2: "",
    townCity: "London",
    postcode: "SE18 5AD",
    latitude: 51.4893,
    longitude: 0.0648,
    radiusMiles: 5,
    isMain: true,
  },
];

export const DEFAULT_CLUB_MEDIA: ClubProfileMediaItem[] = [
  {
    id: "media-1",
    type: "photo",
    url: "",
    caption: "Saturday football skills session",
    sortOrder: 0,
  },
  {
    id: "media-2",
    type: "highlight",
    url: "",
    caption: "Holiday camp highlights",
    sortOrder: 1,
  },
];

export const DEFAULT_CLUB_CONTACT: ClubProfileContact = {
  email: "hello@playvera.example",
  phone: "+44 20 7946 0123",
  whatsapp: "+447700900123",
  website: "https://playvera.example",
};

export const DEFAULT_CLUB_SOCIAL_LINKS: ClubSocialLinks = {
  instagram: "https://instagram.com/playverajuniors",
  facebook: "https://facebook.com/playverajuniors",
  linkedin: "https://linkedin.com/company/playverajuniors",
  x: "https://x.com/playverajuniors",
  tiktok: "https://tiktok.com/@playverajuniors",
  youtube: "",
  threads: "",
  snapchat: "",
  pinterest: "",
  website: "https://playvera.example",
};

function migrateLegacySocialLinks(
  legacy: LegacyClubProfileFields,
  defaults: ClubSocialLinks,
): ClubSocialLinks {
  const links = { ...defaults };

  if (legacy.instagram?.trim()) {
    links.instagram = legacy.instagram.includes("://")
      ? legacy.instagram
      : `https://instagram.com/${legacy.instagram.replace(/^@/, "")}`;
  }

  if (legacy.facebook?.trim()) {
    links.facebook = legacy.facebook.includes("://")
      ? legacy.facebook
      : `https://facebook.com/${legacy.facebook}`;
  }

  if (legacy.tiktok?.trim()) {
    links.tiktok = legacy.tiktok.includes("://")
      ? legacy.tiktok
      : `https://tiktok.com/@${legacy.tiktok.replace(/^@/, "")}`;
  }

  if (legacy.website?.trim()) {
    links.website = legacy.website.includes("://")
      ? legacy.website
      : `https://${legacy.website}`;
  }

  return links;
}

function migrateLegacyContact(
  legacy: LegacyClubProfileFields,
  defaults: ClubProfileContact,
): ClubProfileContact {
  return {
    email: legacy.email?.trim() || defaults.email,
    phone: legacy.phone?.trim() || defaults.phone,
    whatsapp: legacy.whatsapp?.trim() || defaults.whatsapp,
    website:
      legacy.website?.trim() && legacy.website.includes("://")
        ? legacy.website
        : legacy.website?.trim()
          ? `https://${legacy.website}`
          : defaults.website,
  };
}

export function migrateLegacyClubProfile(
  raw: Partial<ClubProfile> & LegacyClubProfileFields,
): Pick<ClubProfile, "contact" | "socialLinks" | "verificationStatus"> {
  const defaults = createDefaultClubProfile();

  const contact =
    raw.contact ??
    migrateLegacyContact(raw, defaults.contact ?? DEFAULT_CLUB_CONTACT);

  const socialLinks =
    raw.socialLinks ??
    migrateLegacySocialLinks(raw, defaults.socialLinks ?? DEFAULT_CLUB_SOCIAL_LINKS);

  const verificationStatus =
    raw.verificationStatus ??
    (raw.verified ? "verified" : "unverified");

  const normalizedContact = normalizeClubContact(contact).contact;
  const normalizedSocial = normalizeClubSocialLinks(socialLinks).socialLinks;

  return {
    contact: normalizedContact,
    socialLinks: normalizedSocial,
    verificationStatus,
  };
}

export function createDefaultClubProfile(): ClubProfile {
  const now = new Date().toISOString();

  return {
    id: "local-club-profile",
    providerId: "local-provider",
    logoUrl: null,
    coverImageUrl: null,
    clubName: "PlayVera Juniors",
    tagline: "Confidence through play, every week.",
    shortDescription:
      "After-school and weekend activities for children aged 4–12 across South East London.",
    establishedYear: 2018,
    verificationStatus: "unverified",
    longDescription:
      "PlayVera Juniors helps children build confidence through structured play, teamwork, and creative sessions. Our coaches focus on inclusion, fun, and measurable progress — whether your child is trying a sport for the first time or levelling up their skills.",
    uniqueSellingPoints:
      "Small group sizes, qualified coaches, parent updates after every session, and flexible trial bookings.",
    categories: ["Sports", "Holiday camps", "After-school clubs"],
    ageRanges: ["3–5 years", "6–8 years", "9–11 years"],
    accessibilityOptions: ["Step-free entry", "SEN-friendly sessions"],
    locations: DEFAULT_CLUB_LOCATIONS,
    contact: DEFAULT_CLUB_CONTACT,
    socialLinks: DEFAULT_CLUB_SOCIAL_LINKS,
    branding: DEFAULT_CLUB_BRANDING,
    customerView: DEFAULT_CLUB_CUSTOMER_VIEW,
    mediaGallery: DEFAULT_CLUB_MEDIA,
    publicSlug: "playvera-juniors",
    metaTitle: "PlayVera Juniors | Children's activities in South East London",
    metaDescription:
      "Book after-school clubs, sports sessions, and holiday camps with PlayVera Juniors.",
    published: true,
    visibility: "published",
    createdAt: now,
    updatedAt: now,
  };
}

export const DEMO_CLUB_FAQ = [
  {
    question: "What should my child bring?",
    answer:
      "Comfortable clothing, a water bottle, and indoor trainers. We provide all equipment.",
  },
  {
    question: "Can I book a trial session?",
    answer:
      "Yes. Look for activities marked with a free trial ticket when booking online.",
  },
  {
    question: "Where do I drop off and collect?",
    answer:
      "Use the main venue entrance listed on your booking confirmation email.",
  },
] as const;

export const DEMO_CLUB_TESTIMONIALS = [
  {
    id: "t1",
    parentName: "Amelia R.",
    quote:
      "My daughter went from shy to confident in three weeks. The coaches are brilliant.",
    childAge: "Age 7",
  },
  {
    id: "t2",
    parentName: "James T.",
    quote:
      "Clear communication, easy booking, and brilliant holiday camp structure.",
    childAge: "Age 9",
  },
] as const;
