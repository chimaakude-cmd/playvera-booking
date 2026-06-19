import type { Database } from "@/lib/database.types";
import {
  createDefaultClubProfile,
  DEFAULT_CLUB_BRANDING,
  DEFAULT_CLUB_CUSTOMER_VIEW,
} from "./defaults";
import {
  normalizeClubContact,
  normalizeClubSocialLinks,
} from "./links";
import type {
  ClubProfile,
  ClubProfileBranding,
  ClubProfileContact,
  ClubProfileCustomerView,
  ClubProfileInput,
  ClubProfileLocation,
  ClubProfileMediaItem,
  ClubProfileVisibility,
  ClubSocialLinks,
  ClubVerificationStatus,
} from "./types";
import {
  createEmptyContact,
  createEmptySocialLinks,
} from "./types";

type ClubProfileRow = Database["public"]["Tables"]["club_profiles"]["Row"];
type ClubProfileLocationRow =
  Database["public"]["Tables"]["club_profile_locations"]["Row"];

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function asContact(value: unknown, row: ClubProfileRow): ClubProfileContact {
  const fallback = createEmptyContact();
  fallback.email = row.email ?? "";
  fallback.phone = row.phone ?? "";
  fallback.whatsapp = row.whatsapp ?? "";
  fallback.website = row.website ?? "";

  if (!value || typeof value !== "object") {
    return fallback;
  }

  const record = value as Record<string, unknown>;
  return {
    email: typeof record.email === "string" ? record.email : fallback.email,
    phone: typeof record.phone === "string" ? record.phone : fallback.phone,
    whatsapp:
      typeof record.whatsapp === "string" ? record.whatsapp : fallback.whatsapp,
    website:
      typeof record.website === "string" ? record.website : fallback.website,
  };
}

function asSocialLinks(value: unknown, row: ClubProfileRow): ClubSocialLinks {
  const fallback = createEmptySocialLinks();
  fallback.instagram = row.instagram ?? "";
  fallback.facebook = row.facebook ?? "";
  fallback.tiktok = row.tiktok ?? "";
  fallback.website = row.website ?? fallback.website;

  if (!value || typeof value !== "object") {
    return fallback;
  }

  const record = value as Record<string, unknown>;
  const merged = { ...fallback };

  for (const key of Object.keys(fallback) as Array<keyof ClubSocialLinks>) {
    if (typeof record[key] === "string") {
      merged[key] = record[key];
    }
  }

  return merged;
}

function asBranding(value: unknown): ClubProfileBranding {
  const defaults = DEFAULT_CLUB_BRANDING;
  if (!value || typeof value !== "object") {
    return defaults;
  }

  const record = value as Record<string, unknown>;
  return {
    primaryColor:
      typeof record.primaryColor === "string"
        ? record.primaryColor
        : defaults.primaryColor,
    secondaryColor:
      typeof record.secondaryColor === "string"
        ? record.secondaryColor
        : defaults.secondaryColor,
    buttonStyle:
      record.buttonStyle === "rounded" ||
      record.buttonStyle === "pill" ||
      record.buttonStyle === "square"
        ? record.buttonStyle
        : defaults.buttonStyle,
    cardStyle:
      record.cardStyle === "soft" ||
      record.cardStyle === "bordered" ||
      record.cardStyle === "elevated"
        ? record.cardStyle
        : defaults.cardStyle,
    fontPreset:
      record.fontPreset === "modern" ||
      record.fontPreset === "friendly" ||
      record.fontPreset === "classic"
        ? record.fontPreset
        : defaults.fontPreset,
  };
}

function asCustomerView(value: unknown): ClubProfileCustomerView {
  const defaults = DEFAULT_CLUB_CUSTOMER_VIEW;
  if (!value || typeof value !== "object") {
    return defaults;
  }

  const record = value as Record<string, unknown>;
  return {
    showTeam: typeof record.showTeam === "boolean" ? record.showTeam : defaults.showTeam,
    showTestimonials:
      typeof record.showTestimonials === "boolean"
        ? record.showTestimonials
        : defaults.showTestimonials,
    showMap: typeof record.showMap === "boolean" ? record.showMap : defaults.showMap,
    showSocialLinks:
      typeof record.showSocialLinks === "boolean"
        ? record.showSocialLinks
        : defaults.showSocialLinks,
    showAgeRanges:
      typeof record.showAgeRanges === "boolean"
        ? record.showAgeRanges
        : defaults.showAgeRanges,
    showGallery:
      typeof record.showGallery === "boolean"
        ? record.showGallery
        : defaults.showGallery,
  };
}

function asMediaGallery(value: unknown): ClubProfileMediaItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const type =
        record.type === "photo" ||
        record.type === "video" ||
        record.type === "highlight"
          ? record.type
          : "photo";

      return {
        id: typeof record.id === "string" ? record.id : crypto.randomUUID(),
        type,
        url: typeof record.url === "string" ? record.url : "",
        caption: typeof record.caption === "string" ? record.caption : "",
        sortOrder:
          typeof record.sortOrder === "number" ? record.sortOrder : index,
      } satisfies ClubProfileMediaItem;
    })
    .filter((item): item is ClubProfileMediaItem => item !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function mapLocationRow(row: ClubProfileLocationRow): ClubProfileLocation {
  return {
    id: row.id,
    venueName: row.venue_name,
    addressLine1: row.address_line_1,
    addressLine2: row.address_line_2,
    townCity: row.town_city,
    postcode: row.postcode,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    radiusMiles: Number(row.radius_miles),
    isMain: row.is_main,
  };
}

/** Persist only non-empty social URLs; empty form state becomes `{}` in Postgres. */
export function compactSocialLinksForDb(
  socialLinks: ClubSocialLinks,
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(socialLinks)) {
    if (typeof value === "string" && value.trim()) {
      result[key] = value.trim();
    }
  }

  return result;
}

function compactContactForDb(contact: ClubProfileContact): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(contact)) {
    if (typeof value === "string" && value.trim()) {
      result[key] = value.trim();
    }
  }

  return result;
}

function resolveVisibility(row: ClubProfileRow): ClubProfileVisibility {
  const visibility = (row as ClubProfileRow & { visibility?: string }).visibility;
  if (
    visibility === "draft" ||
    visibility === "published" ||
    visibility === "hidden"
  ) {
    return visibility;
  }

  return row.published ? "published" : "draft";
}

export function mapClubProfileRowToProfile(
  row: ClubProfileRow,
  locations: ClubProfileLocationRow[] = [],
): ClubProfile {
  const defaults = createDefaultClubProfile();
  const contact = normalizeClubContact(asContact(row.contact, row)).contact;
  const socialLinks = normalizeClubSocialLinks(
    asSocialLinks(row.social_links, row),
  ).socialLinks;
  const visibility = resolveVisibility(row);

  return {
    id: row.id,
    providerId: row.provider_id,
    logoUrl: row.logo_url,
    coverImageUrl: row.cover_image_url,
    clubName: row.club_name,
    tagline: row.tagline,
    shortDescription: row.short_description,
    establishedYear: row.established_year,
    verificationStatus: row.verification_status as ClubVerificationStatus,
    longDescription: row.long_description,
    uniqueSellingPoints: row.unique_selling_points,
    categories: asStringArray(row.categories),
    ageRanges: asStringArray(row.age_ranges),
    accessibilityOptions: asStringArray(row.accessibility_options),
    locations: locations.length
      ? locations.map(mapLocationRow)
      : defaults.locations,
    contact,
    socialLinks,
    branding: asBranding(row.branding),
    customerView: asCustomerView(row.customer_view),
    mediaGallery: asMediaGallery(row.media_gallery),
    publicSlug: row.public_slug ?? "",
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    published: visibility !== "draft",
    visibility,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type ClubProfilePersistRow =
  Database["public"]["Tables"]["club_profiles"]["Insert"];

/** Base schema (00008) row — omits jsonb columns added in 00009/00045 for legacy production. */
export type LegacyClubProfilePersistRow = Omit<
  ClubProfilePersistRow,
  "contact" | "social_links" | "verification_status" | "visibility"
>;

function buildClubProfilePersistScalars(
  input: ClubProfileInput,
): {
  contact: ClubProfileContact;
  socialLinks: ClubSocialLinks;
  visibility: ClubProfileVisibility;
  published: boolean;
} {
  const { contact } = normalizeClubContact(input.contact);
  const { socialLinks } = normalizeClubSocialLinks(input.socialLinks);
  const visibility = input.visibility ?? (input.published ? "published" : "draft");
  const published = visibility !== "draft";

  return { contact, socialLinks, visibility, published };
}

export function mapClubProfileInputToLegacyRow(
  profileId: string,
  providerId: string,
  input: ClubProfileInput,
): LegacyClubProfilePersistRow {
  const { contact, socialLinks, visibility, published } =
    buildClubProfilePersistScalars(input);

  return {
    id: profileId,
    provider_id: providerId,
    logo_url: input.logoUrl,
    cover_image_url: input.coverImageUrl,
    club_name: input.clubName.trim(),
    tagline: input.tagline.trim(),
    short_description: input.shortDescription.trim(),
    established_year: input.establishedYear,
    verified: input.verificationStatus !== "unverified",
    long_description: input.longDescription.trim(),
    unique_selling_points: input.uniqueSellingPoints.trim(),
    categories: input.categories,
    age_ranges: input.ageRanges,
    accessibility_options: input.accessibilityOptions,
    email: contact.email,
    phone: contact.phone,
    whatsapp: contact.whatsapp,
    website: contact.website || socialLinks.website,
    instagram: socialLinks.instagram,
    facebook: socialLinks.facebook,
    tiktok: socialLinks.tiktok,
    branding: input.branding,
    customer_view: input.customerView,
    media_gallery: input.mediaGallery,
    public_slug: input.publicSlug.trim() || null,
    meta_title: input.metaTitle.trim(),
    meta_description: input.metaDescription.trim(),
    published,
  };
}

export function mapClubProfileInputToRow(
  profileId: string,
  providerId: string,
  input: ClubProfileInput,
): ClubProfilePersistRow {
  const { contact, socialLinks, visibility, published } =
    buildClubProfilePersistScalars(input);

  return {
    ...mapClubProfileInputToLegacyRow(profileId, providerId, input),
    contact: compactContactForDb(contact),
    social_links: compactSocialLinksForDb(socialLinks),
    verification_status: input.verificationStatus,
    visibility,
    published,
  };
}

export function mapLocationInputToRow(
  clubProfileId: string,
  location: ClubProfileLocation,
  sortOrder: number,
): Database["public"]["Tables"]["club_profile_locations"]["Insert"] {
  return {
    id: location.id,
    club_profile_id: clubProfileId,
    venue_name: location.venueName.trim(),
    address_line_1: location.addressLine1.trim(),
    address_line_2: location.addressLine2.trim(),
    town_city: location.townCity.trim(),
    postcode: location.postcode.trim(),
    latitude: location.latitude,
    longitude: location.longitude,
    radius_miles: location.radiusMiles,
    is_main: location.isMain,
    sort_order: sortOrder,
  };
}
