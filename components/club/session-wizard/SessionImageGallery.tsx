"use client";

import { useRef, useState } from "react";
import {
  imageStorage,
  uploadSessionImage,
  validateImageFile,
} from "@/lib/image-storage";
import { SafeImage } from "@/components/ui/SafeImage";
import { resolveImagePreviewUrl } from "@/lib/session-images";

const MAX_GALLERY_IMAGES = 5;

type SessionImageGalleryProps = {
  imageIds: string[];
  onChange: (imageIds: string[]) => void;
};

export function SessionImageGallery({
  imageIds,
  onChange,
}: SessionImageGalleryProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const canAddMore = imageIds.length < MAX_GALLERY_IMAGES;

  async function uploadFiles(files: FileList | File[]) {
    if (!canAddMore) {
      setError(`You can add up to ${MAX_GALLERY_IMAGES} gallery images.`);
      return;
    }

    const fileArray = Array.from(files);
    const availableSlots = MAX_GALLERY_IMAGES - imageIds.length;
    const filesToUpload = fileArray.slice(0, availableSlots);

    if (fileArray.length > availableSlots) {
      setError(`Only ${availableSlots} more image${availableSlots === 1 ? "" : "s"} can be added.`);
    } else {
      setError(null);
    }

    setUploading(true);
    setNotice(null);

    const nextIds = [...imageIds];
    const fallbackMessages: string[] = [];

    try {
      for (const file of filesToUpload) {
        const validationError = validateImageFile(file);
        if (validationError) {
          throw new Error(validationError);
        }

        const uploaded = await uploadSessionImage(file);
        nextIds.push(uploaded.id);

        if (uploaded.fallbackWarning) {
          fallbackMessages.push(uploaded.fallbackWarning);
        }
      }

      onChange(nextIds);

      if (fallbackMessages.length > 0) {
        setNotice(fallbackMessages[0]);
      }
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not upload gallery images.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function handleRemove(id: string) {
    onChange(imageIds.filter((imageId) => imageId !== id));
    await imageStorage.remove(id);
    setError(null);
  }

  function reorderImages(sourceId: string, targetId: string) {
    if (sourceId === targetId) {
      return;
    }

    const nextIds = [...imageIds];
    const sourceIndex = nextIds.indexOf(sourceId);
    const targetIndex = nextIds.indexOf(targetId);

    if (sourceIndex === -1 || targetIndex === -1) {
      return;
    }

    nextIds.splice(sourceIndex, 1);
    nextIds.splice(targetIndex, 0, sourceId);
    onChange(nextIds);
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => void uploadFiles(event.target.files ?? [])}
      />

      {imageIds.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {imageIds.map((id, index) => {
            const previewUrl = resolveImagePreviewUrl(id);

            return (
              <li
                key={id}
                draggable
                onDragStart={() => setDraggedId(id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (draggedId) {
                    reorderImages(draggedId, id);
                  }
                  setDraggedId(null);
                }}
                onDragEnd={() => setDraggedId(null)}
                className={`overflow-hidden rounded-2xl border bg-white transition-shadow ${
                  draggedId === id
                    ? "border-pink-500 shadow-md"
                    : "border-zinc-200"
                }`}
              >
                <div className="relative aspect-[4/3] bg-zinc-100">
                  {previewUrl ? (
                    <SafeImage
                      src={previewUrl}
                      alt={`Gallery image ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                  <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    {index + 1}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-zinc-100 p-2">
                  <span className="text-xs text-zinc-500">Drag to reorder</span>
                  <button
                    type="button"
                    onClick={() => void handleRemove(id)}
                    className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {canAddMore ? (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragActive(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            void uploadFiles(event.dataTransfer.files);
          }}
          className={`rounded-2xl border-2 border-dashed p-5 text-center transition-colors ${
            dragActive
              ? "border-pink-500 bg-pink-50"
              : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-zinc-100"
          }`}
        >
          <p className="text-sm font-medium text-zinc-900">
            Add gallery images ({imageIds.length}/{MAX_GALLERY_IMAGES})
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Drag and drop up to {MAX_GALLERY_IMAGES} images, or browse from your
            device
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="mt-4 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60"
          >
            {uploading ? "Uploading..." : "Choose images"}
          </button>
        </div>
      ) : (
        <p className="text-xs text-zinc-500">
          Gallery full. Remove an image to upload another.
        </p>
      )}

      {notice ? <p className="text-xs text-amber-700">{notice}</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
