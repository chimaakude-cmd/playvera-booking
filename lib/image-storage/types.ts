import type { StorageBucket } from "./buckets";

export type ImageStorageBackend = "supabase" | "localStorage";

export type StoredImage = {
  /** Public URL (Supabase) or localStorage image id */
  id: string;
  previewUrl: string;
  fileName: string;
  mimeType: string;
  createdAt: string;
  backend: ImageStorageBackend;
  bucket?: StorageBucket;
  /** Set when Supabase failed and localStorage was used instead */
  fallbackWarning?: string;
};

export type ImageUploadOptions = {
  bucket?: StorageBucket;
};

export type ImageUploadResult = StoredImage;

export interface ImageStorageProvider {
  upload(file: File, options?: ImageUploadOptions): Promise<ImageUploadResult>;
  remove(id: string, options?: ImageUploadOptions): Promise<void>;
  get(id: string): StoredImage | null;
  getPreviewUrl(id: string | null | undefined): string | null;
  has(id: string): boolean;
}

export function isPublicImageUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

export function isLocalImageReference(value: string): boolean {
  return (
    value.startsWith("data:image/") ||
    (!isPublicImageUrl(value) && value.length > 0)
  );
}
