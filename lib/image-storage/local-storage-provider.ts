/**
 * Browser localStorage image previews for session uploads.
 *
 * Storage key: activora-image-storage
 *
 * Supabase migration:
 * - Upload blobs to a Supabase Storage bucket (e.g. session-images)
 * - Store public/signed URLs in session.details.images
 * - Swap provider via NEXT_PUBLIC_IMAGE_STORAGE_PROVIDER=supabase
 *   (see lib/image-storage/supabase-provider.ts)
 */
import { compressImageFile } from "./compress-image";
import {
  ImageStorageProvider,
  ImageUploadOptions,
  StoredImage,
} from "./types";

const IMAGE_STORAGE_KEY = "activora-image-storage";

type ImageStoreRecord = Record<
  string,
  {
    id: string;
    previewDataUrl: string;
    fileName: string;
    mimeType: string;
    createdAt: string;
  }
>;

function readStore(): ImageStoreRecord {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = localStorage.getItem(IMAGE_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    return JSON.parse(raw) as ImageStoreRecord;
  } catch {
    return {};
  }
}

function writeStore(store: ImageStoreRecord): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(store));
}

function toStoredImage(entry: ImageStoreRecord[string]): StoredImage {
  return {
    id: entry.id,
    previewUrl: entry.previewDataUrl,
    fileName: entry.fileName,
    mimeType: entry.mimeType,
    createdAt: entry.createdAt,
    backend: "localStorage",
  };
}

export class LocalStorageImageProvider implements ImageStorageProvider {
  upload(file: File, _options?: ImageUploadOptions): Promise<StoredImage> {
    return compressImageFile(file).then(({ previewDataUrl, mimeType }) => {
      const store = readStore();
      const id = crypto.randomUUID();
      const entry = {
        id,
        previewDataUrl,
        fileName: file.name,
        mimeType,
        createdAt: new Date().toISOString(),
      };

      store[id] = entry;

      try {
        writeStore(store);
      } catch {
        delete store[id];
        throw new Error(
          "Could not save the image preview. Try a smaller image or remove older uploads.",
        );
      }

      return toStoredImage(entry);
    });
  }

  async remove(id: string, _options?: ImageUploadOptions): Promise<void> {
    const store = readStore();
    if (!store[id]) {
      return;
    }

    delete store[id];
    writeStore(store);
  }

  get(id: string): StoredImage | null {
    const entry = readStore()[id];
    return entry ? toStoredImage(entry) : null;
  }

  getPreviewUrl(id: string | null | undefined): string | null {
    if (!id) {
      return null;
    }

    if (id.startsWith("data:image/")) {
      return id;
    }

    return this.get(id)?.previewUrl ?? null;
  }

  has(id: string): boolean {
    return Boolean(readStore()[id]);
  }
}
