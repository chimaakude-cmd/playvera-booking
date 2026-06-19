import { EMAIL_ASSET_BUCKET, SESSION_IMAGE_BUCKET } from "./buckets";
import { LocalStorageImageProvider } from "./local-storage-provider";
import { ResilientImageStorageProvider } from "./resilient-provider";
import {
  isSupabaseStorageConfigured,
  SupabaseImageStorageProvider,
} from "./supabase-provider";
import { ImageStorageProvider } from "./types";

function shouldPreferSupabase(): boolean {
  if (process.env.NEXT_PUBLIC_IMAGE_STORAGE_PROVIDER === "localStorage") {
    return false;
  }

  return true;
}

/**
 * Session image uploads with Supabase Storage when configured,
 * localStorage fallback when not configured or when upload fails.
 */
export function createImageStorageProvider(): ImageStorageProvider {
  return new ResilientImageStorageProvider(
    new SupabaseImageStorageProvider(),
    new LocalStorageImageProvider(),
    { preferSupabase: shouldPreferSupabase() },
  );
}

export const imageStorage = createImageStorageProvider();

export function shouldShowStorageSetupNotice(): boolean {
  if (process.env.NEXT_PUBLIC_IMAGE_STORAGE_PROVIDER === "localStorage") {
    return false;
  }

  return !isSupabaseStorageConfigured();
}

export function uploadSessionImage(file: File) {
  return imageStorage.upload(file, { bucket: SESSION_IMAGE_BUCKET });
}

export function uploadEmailAsset(file: File) {
  return imageStorage.upload(file, { bucket: EMAIL_ASSET_BUCKET });
}

export {
  uploadClubGalleryMedia,
  uploadProviderLogo,
  validateClubVideoFile,
} from "./club-media";

export type { ImageStorageProvider, StoredImage } from "./types";
export {
  ACCEPTED_IMAGE_EXTENSIONS,
  MAX_IMAGE_FILE_SIZE_BYTES,
  validateImageFile,
} from "./compress-image";
export {
  EMAIL_ASSET_BUCKET,
  PROVIDER_LOGO_BUCKET,
  SESSION_IMAGE_BUCKET,
  STORAGE_BUCKETS,
  type StorageBucket,
} from "./buckets";
export {
  getSupabaseStorageSetupMessage,
  isSupabaseStorageConfigured,
} from "./supabase-provider";