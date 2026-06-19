import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase";
import {
  PROVIDER_LOGO_BUCKET,
  SESSION_IMAGE_BUCKET,
  STORAGE_MAX_FILE_BYTES,
} from "./buckets";
import { compressImageFile, validateImageFile } from "./compress-image";
import { createImageStorageProvider } from "./index";
import type { StoredImage } from "./types";

const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm"] as const;
const MAX_VIDEO_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export function validateClubVideoFile(file: File): string | null {
  if (
    !ACCEPTED_VIDEO_TYPES.includes(
      file.type as (typeof ACCEPTED_VIDEO_TYPES)[number],
    )
  ) {
    return "Use an MP4 or WebM video.";
  }

  if (file.size > MAX_VIDEO_FILE_SIZE_BYTES) {
    return "Each video must be 50MB or smaller.";
  }

  return null;
}

function extensionForVideoMimeType(mimeType: string): string {
  return mimeType === "video/webm" ? "webm" : "mp4";
}

async function uploadRawFileToBucket(
  file: File,
  bucket: typeof SESSION_IMAGE_BUCKET | typeof PROVIDER_LOGO_BUCKET,
  pathPrefix: string,
): Promise<StoredImage> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase Storage is not configured.");
  }

  const supabase = getSupabaseBrowserClient();
  const path = `${pathPrefix}/${crypto.randomUUID()}.${extensionForVideoMimeType(file.type)}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return {
    id: data.publicUrl,
    previewUrl: data.publicUrl,
    fileName: file.name,
    mimeType: file.type,
    createdAt: new Date().toISOString(),
    backend: "supabase",
    bucket,
  };
}

export function uploadProviderLogo(file: File) {
  return createImageStorageProvider().upload(file, {
    bucket: PROVIDER_LOGO_BUCKET,
  });
}

export function uploadClubGalleryMedia(
  file: File,
  mediaType: "photo" | "video" | "highlight" = "photo",
) {
  if (mediaType === "video") {
    const validationError = validateClubVideoFile(file);
    if (validationError) {
      return Promise.reject(new Error(validationError));
    }

    return uploadRawFileToBucket(file, SESSION_IMAGE_BUCKET, "club-media/videos");
  }

  const validationError = validateImageFile(file);
  if (validationError) {
    return Promise.reject(new Error(validationError));
  }

  if (file.size > STORAGE_MAX_FILE_BYTES) {
    return Promise.reject(new Error("Each image must be 10MB or smaller."));
  }

  return compressImageFile(file).then(async ({ previewDataUrl, mimeType }) => {
    const response = await fetch(previewDataUrl);
    const blob = await response.blob();
    const supabase = getSupabaseBrowserClient();
    const extension =
      mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
    const path = `club-media/photos/${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage.from(SESSION_IMAGE_BUCKET).upload(
      path,
      blob,
      {
        contentType: mimeType,
        cacheControl: "3600",
        upsert: false,
      },
    );

    if (error) {
      throw new Error(error.message);
    }

    const { data } = supabase.storage.from(SESSION_IMAGE_BUCKET).getPublicUrl(path);

    return {
      id: data.publicUrl,
      previewUrl: data.publicUrl,
      fileName: file.name,
      mimeType,
      createdAt: new Date().toISOString(),
      backend: "supabase" as const,
      bucket: SESSION_IMAGE_BUCKET,
    };
  });
}
