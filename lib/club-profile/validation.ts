import type { ClubProfileInput } from "./types";

export type ClubProfilePublishErrors = {
  logoUrl?: string;
  description?: string;
  contact?: string;
};

/** Profiles auto-publish on save — no manual publish gate. */
export function validateClubProfilePublish(
  _input: ClubProfileInput,
): ClubProfilePublishErrors {
  return {};
}

export function hasPublishErrors(errors: ClubProfilePublishErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function formatPublishErrors(errors: ClubProfilePublishErrors): string {
  return Object.values(errors).filter(Boolean).join(" ");
}
