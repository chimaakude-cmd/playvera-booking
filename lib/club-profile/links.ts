import type {
  ClubProfileContact,
  ClubSocialLinks,
  ClubSocialPlatform,
} from "./types";
import { CLUB_SOCIAL_PLATFORMS } from "./types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PLATFORM_HOST_PATTERNS: Record<ClubSocialPlatform, RegExp[]> = {
  instagram: [/^(?:www\.)?instagram\.com$/i],
  facebook: [/^(?:www\.)?facebook\.com$/i, /^(?:www\.)?fb\.com$/i],
  linkedin: [/^(?:www\.)?linkedin\.com$/i],
  x: [/^(?:www\.)?x\.com$/i, /^(?:www\.)?twitter\.com$/i],
  tiktok: [/^(?:www\.)?tiktok\.com$/i],
  youtube: [
    /^(?:www\.)?youtube\.com$/i,
    /^(?:www\.)?youtu\.be$/i,
  ],
  threads: [/^(?:www\.)?threads\.net$/i],
  snapchat: [/^(?:www\.)?snapchat\.com$/i],
  pinterest: [/^(?:www\.)?pinterest\.com$/i, /^(?:www\.)?pin\.it$/i],
  website: [/.+/],
};

export type LinkValidationResult = {
  value: string;
  error: string | null;
};

export function stripDuplicateProtocol(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  return trimmed.replace(/^(?:https?:\/\/)+/i, "https://");
}

export function normalizeHttpUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const candidate = /^https?:\/\//i.test(trimmed)
    ? stripDuplicateProtocol(trimmed)
    : `https://${stripDuplicateProtocol(trimmed)}`;

  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    url.hostname = url.hostname.toLowerCase();
    return url.toString();
  } catch {
    return null;
  }
}

export function normalizeEmail(value: string): LinkValidationResult {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return { value: "", error: "Email is required." };
  }

  if (!EMAIL_PATTERN.test(trimmed)) {
    return { value: trimmed, error: "Enter a valid email address." };
  }

  return { value: trimmed, error: null };
}

export function normalizePhone(value: string): LinkValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { value: "", error: null };
  }

  const digits = trimmed.replace(/[^\d+]/g, "");
  if (digits.replace(/\D/g, "").length < 7) {
    return { value: trimmed, error: "Enter a valid phone number." };
  }

  return { value: trimmed, error: null };
}

export function normalizeWhatsApp(value: string): LinkValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { value: "", error: null };
  }

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 8) {
    return { value: trimmed, error: "Enter a valid WhatsApp number." };
  }

  return { value: trimmed, error: null };
}

export function normalizeWebsiteUrl(value: string): LinkValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { value: "", error: null };
  }

  const normalized = normalizeHttpUrl(trimmed);
  if (!normalized) {
    return { value: trimmed, error: "Enter a valid website URL." };
  }

  return { value: normalized, error: null };
}

function hostMatchesPlatform(
  hostname: string,
  platform: ClubSocialPlatform,
): boolean {
  if (platform === "website") {
    return Boolean(hostname);
  }

  return PLATFORM_HOST_PATTERNS[platform].some((pattern) =>
    pattern.test(hostname),
  );
}

export function normalizeSocialLink(
  platform: ClubSocialPlatform,
  value: string,
): LinkValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { value: "", error: null };
  }

  const normalized = normalizeHttpUrl(trimmed);
  if (!normalized) {
    return {
      value: trimmed,
      error: `Enter a full ${platform} URL.`,
    };
  }

  const hostname = new URL(normalized).hostname.replace(/^www\./i, "");
  if (!hostMatchesPlatform(hostname, platform)) {
    return {
      value: normalized,
      error: `This URL does not look like a ${platform} link.`,
    };
  }

  return { value: normalized, error: null };
}

export function normalizeClubContact(
  contact: ClubProfileContact,
): { contact: ClubProfileContact; errors: Partial<Record<keyof ClubProfileContact, string>> } {
  const email = normalizeEmail(contact.email);
  const phone = normalizePhone(contact.phone);
  const whatsapp = normalizeWhatsApp(contact.whatsapp);
  const website = normalizeWebsiteUrl(contact.website);

  const errors: Partial<Record<keyof ClubProfileContact, string>> = {};
  if (email.error) errors.email = email.error;
  if (phone.error) errors.phone = phone.error;
  if (whatsapp.error) errors.whatsapp = whatsapp.error;
  if (website.error) errors.website = website.error;

  return {
    contact: {
      email: email.value,
      phone: phone.value,
      whatsapp: whatsapp.value,
      website: website.value,
    },
    errors,
  };
}

export function normalizeClubSocialLinks(
  socialLinks: ClubSocialLinks,
): {
  socialLinks: ClubSocialLinks;
  errors: Partial<Record<ClubSocialPlatform, string>>;
} {
  const normalized = { ...socialLinks };
  const errors: Partial<Record<ClubSocialPlatform, string>> = {};

  for (const platform of CLUB_SOCIAL_PLATFORMS) {
    const result = normalizeSocialLink(platform, socialLinks[platform] ?? "");
    normalized[platform] = result.value;
    if (result.error) {
      errors[platform] = result.error;
    }
  }

  return { socialLinks: normalized, errors };
}

export function buildMailtoHref(email: string): string {
  return `mailto:${email.trim()}`;
}

export function buildTelHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  return `tel:${digits}`;
}

export function buildWhatsAppHref(value: string): string {
  const digits = value.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

export function hasContactMethod(contact: ClubProfileContact): boolean {
  return Boolean(
    contact.email.trim() ||
      contact.phone.trim() ||
      contact.whatsapp.trim() ||
      contact.website.trim(),
  );
}

export function getActiveSocialLinks(
  socialLinks: ClubSocialLinks,
): Array<{ platform: ClubSocialPlatform; url: string }> {
  return CLUB_SOCIAL_PLATFORMS.filter((platform) =>
    Boolean(socialLinks[platform]?.trim()),
  ).map((platform) => ({
    platform,
    url: socialLinks[platform],
  }));
}
