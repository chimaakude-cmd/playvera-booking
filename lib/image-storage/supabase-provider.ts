import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import {
  SESSION_IMAGE_BUCKET,
  STORAGE_ALLOWED_MIME_TYPES,
  STORAGE_MAX_FILE_BYTES,
  StorageBucket,
} from "./buckets";
import { compressImageFile } from "./compress-image";
import {
  ImageStorageProvider,
  ImageUploadOptions,
  StoredImage,
  isPublicImageUrl,
} from "./types";

export function isSupabaseStorageConfigured(): boolean {
  return isSupabaseConfigured();
}

export function getSupabaseStorageSetupMessage(): string {
  return (
    "Supabase Storage is not configured. Add NEXT_PUBLIC_SUPABASE_URL and " +
    "NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, create the session-images, " +
    "provider-logos, and email-assets buckets (see supabase/STORAGE_SETUP.md), " +
    "run supabase/migrations/00002_storage_buckets.sql, then restart the dev server."
  );
}

function formatStorageError(message: string, bucket: StorageBucket): string {
  if (message.toLowerCase().includes("bucket not found")) {
    return (
      `Supabase bucket "${bucket}" was not found. Create it in Storage → Buckets ` +
      "or run supabase/migrations/00002_storage_buckets.sql."
    );
  }

  if (
    message.toLowerCase().includes("row-level security") ||
    message.toLowerCase().includes("policy")
  ) {
    return (
      `Upload blocked by Storage policies for "${bucket}". ` +
      "Run supabase/migrations/00002_storage_buckets.sql to add public read/upload policies."
    );
  }

  return `Supabase Storage upload failed: ${message}`;
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

function extensionForMimeType(mimeType: string): string {
  if (mimeType === "image/png") {
    return "png";
  }
  if (mimeType === "image/webp") {
    return "webp";
  }
  return "jpg";
}

function parsePublicUrl(url: string): { bucket: StorageBucket; path: string } | null {
  try {
    const parsed = new URL(url);
    const marker = "/storage/v1/object/public/";
    const index = parsed.pathname.indexOf(marker);
    if (index === -1) {
      return null;
    }

    const remainder = parsed.pathname.slice(index + marker.length);
    const slashIndex = remainder.indexOf("/");
    if (slashIndex === -1) {
      return null;
    }

    const bucket = remainder.slice(0, slashIndex) as StorageBucket;
    const path = decodeURIComponent(remainder.slice(slashIndex + 1));
    return { bucket, path };
  } catch {
    return null;
  }
}

export class SupabaseImageStorageProvider implements ImageStorageProvider {
  upload(file: File, options?: ImageUploadOptions): Promise<StoredImage> {
    if (!isSupabaseStorageConfigured()) {
      return Promise.reject(new Error(getSupabaseStorageSetupMessage()));
    }

    const bucket = options?.bucket ?? SESSION_IMAGE_BUCKET;

    return compressImageFile(file).then(async ({ previewDataUrl, mimeType }) => {
      const supabase = getSupabaseBrowserClient();
      const blob = await dataUrlToBlob(previewDataUrl);
      const path = `uploads/${crypto.randomUUID()}.${extensionForMimeType(mimeType)}`;

      const { error } = await supabase.storage.from(bucket).upload(path, blob, {
        contentType: mimeType,
        cacheControl: "3600",
        upsert: false,
      });

      if (error) {
        throw new Error(formatStorageError(error.message, bucket));
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      const publicUrl = data.publicUrl;

      return {
        id: publicUrl,
        previewUrl: publicUrl,
        fileName: file.name,
        mimeType,
        createdAt: new Date().toISOString(),
        backend: "supabase",
        bucket,
      };
    });
  }

  async remove(id: string, options?: ImageUploadOptions): Promise<void> {
    if (!isSupabaseStorageConfigured() || !isPublicImageUrl(id)) {
      return;
    }

    const parsed = parsePublicUrl(id);
    if (!parsed) {
      return;
    }

    const bucket = options?.bucket ?? parsed.bucket;
    const supabase = getSupabaseBrowserClient();
    await supabase.storage.from(bucket).remove([parsed.path]);
  }

  get(id: string): StoredImage | null {
    if (!isPublicImageUrl(id)) {
      return null;
    }

    const parsed = parsePublicUrl(id);
    if (!parsed) {
      return null;
    }

    return {
      id,
      previewUrl: id,
      fileName: parsed.path.split("/").pop() ?? "image",
      mimeType: "image/jpeg",
      createdAt: new Date().toISOString(),
      backend: "supabase",
      bucket: parsed.bucket,
    };
  }

  getPreviewUrl(id: string | null | undefined): string | null {
    if (!id) {
      return null;
    }

    if (isPublicImageUrl(id) || id.startsWith("data:image/")) {
      return id;
    }

    return null;
  }

  has(id: string): boolean {
    return isPublicImageUrl(id);
  }
}

export const SUPABASE_STORAGE_LIMITS = {
  maxFileBytes: STORAGE_MAX_FILE_BYTES,
  allowedMimeTypes: STORAGE_ALLOWED_MIME_TYPES,
};
