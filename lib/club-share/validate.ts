import { isPubliclyAccessibleProfile } from "@/lib/club-profile/types";

export type ShareValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export function validateClubShareTarget(options: {
  slug: string;
  visibility?: "draft" | "published" | "hidden";
  published?: boolean;
}): ShareValidationResult {
  const slug = options.slug.trim();
  if (!slug) {
    return {
      ok: false,
      message: "Add a public URL slug in your club profile before sharing.",
    };
  }

  if (
    !isPubliclyAccessibleProfile({
      visibility: options.visibility,
      published: options.published,
    })
  ) {
    return {
      ok: false,
      message: "Publish your club profile before sharing.",
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
