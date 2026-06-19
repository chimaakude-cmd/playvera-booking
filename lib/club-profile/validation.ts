import type { ClubProfileInput } from "./types";

export type ClubProfilePublishErrors = {
  logoUrl?: string;
  description?: string;
  contact?: string;
};

export function validateClubProfilePublish(
  input: ClubProfileInput,
): ClubProfilePublishErrors {
  const errors: ClubProfilePublishErrors = {};
  const visibility = input.visibility ?? (input.published ? "published" : "draft");

  if (visibility === "draft") {
    return errors;
  }

  if (!input.logoUrl?.trim()) {
    errors.logoUrl = "Upload a club logo before publishing.";
  }

  const description =
    input.longDescription.trim() ||
    input.shortDescription.trim() ||
    input.tagline.trim();

  if (!description) {
    errors.description =
      "Add a club description before publishing.";
  }

  const hasEmail = Boolean(input.contact.email.trim());
  const hasPhone = Boolean(input.contact.phone.trim());

  if (!hasEmail && !hasPhone) {
    errors.contact =
      "Add a contact email or phone number before publishing.";
  }

  return errors;
}

export function hasPublishErrors(errors: ClubProfilePublishErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function formatPublishErrors(errors: ClubProfilePublishErrors): string {
  return Object.values(errors).filter(Boolean).join(" ");
}
