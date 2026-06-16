"use client";

import { useRef, useState } from "react";
import {
  imageStorage,
  uploadSessionImage,
  validateImageFile,
} from "@/lib/image-storage";
import { SafeImage } from "@/components/ui/SafeImage";
import { resolveImagePreviewUrl } from "@/lib/session-images";

type MainImageUploadProps = {
  imageId: string | null;
  onChange: (imageId: string | null) => void;
};

export function MainImageUpload({ imageId, onChange }: MainImageUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const previewUrl = resolveImagePreviewUrl(imageId);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) {
      return;
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      setNotice(null);
      return;
    }

    setUploading(true);
    setError(null);
    setNotice(null);

    try {
      const previousId = imageId;
      const uploaded = await uploadSessionImage(file);
      onChange(uploaded.id);

      if (uploaded.fallbackWarning) {
        setNotice(uploaded.fallbackWarning);
      }

      if (previousId && previousId !== uploaded.id) {
        await imageStorage.remove(previousId);
      }
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not upload this image.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function handleRemove() {
    if (!imageId) {
      return;
    }

    await imageStorage.remove(imageId);
    onChange(null);
    setError(null);
    setNotice(null);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    void handleFiles(event.dataTransfer.files);
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => void handleFiles(event.target.files)}
      />

      {previewUrl ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="relative aspect-[16/10] bg-zinc-100">
            <SafeImage
              src={previewUrl}
              alt="Main session preview"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-wrap gap-2 border-t border-zinc-100 p-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60"
            >
              Replace image
            </button>
            <button
              type="button"
              onClick={() => void handleRemove()}
              disabled={uploading}
              className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
            dragActive
              ? "border-pink-500 bg-pink-50"
              : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-zinc-100"
          }`}
        >
          <p className="text-sm font-medium text-zinc-900">
            Upload main session image
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            JPG, PNG, or WebP up to 10MB
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="mt-4 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:bg-zinc-300"
          >
            {uploading ? "Uploading..." : "Choose from device"}
          </button>
          <p className="mt-3 text-xs text-zinc-400">
            Or drag and drop an image here
          </p>
        </div>
      )}

      {notice ? <p className="text-xs text-amber-700">{notice}</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
