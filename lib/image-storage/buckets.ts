/**
 * Activora Supabase Storage buckets.
 * child-documents is intentionally excluded for now.
 */
export const STORAGE_BUCKETS = {
  sessionImages: "session-images",
  providerLogos: "provider-logos",
  emailAssets: "email-assets",
} as const;

export type StorageBucket =
  (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

export const PUBLIC_STORAGE_BUCKETS: StorageBucket[] = [
  STORAGE_BUCKETS.sessionImages,
  STORAGE_BUCKETS.providerLogos,
  STORAGE_BUCKETS.emailAssets,
];

export const SESSION_IMAGE_BUCKET = STORAGE_BUCKETS.sessionImages;
export const EMAIL_ASSET_BUCKET = STORAGE_BUCKETS.emailAssets;
export const PROVIDER_LOGO_BUCKET = STORAGE_BUCKETS.providerLogos;

export const STORAGE_MAX_FILE_BYTES = 10 * 1024 * 1024;

export const STORAGE_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
