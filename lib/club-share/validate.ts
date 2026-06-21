export type ShareValidationResult =
  | { ok: true }
  | { ok: false; message: string };

/** Shareable when the club has a public slug — no manual publish step. */
export function validateClubShareTarget(options: {
  slug: string;
}): ShareValidationResult {
  const slug = options.slug.trim();
  if (!slug) {
    return {
      ok: false,
      message: "Your club profile is being set up. Try again in a moment.",
    };
  }

  return { ok: true };
}

export function validateActivityShareTarget(options: {
  published?: boolean;
  status?: string;
}): ShareValidationResult {
  const isPublished =
    options.published !== false &&
    options.status !== "draft" &&
    options.status !== "archived" &&
    options.status !== "cancelled";

  if (!isPublished) {
    return {
      ok: false,
      message: "This activity must be published before it can be shared.",
    };
  }

  return { ok: true };
}
