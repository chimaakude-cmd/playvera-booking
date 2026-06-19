"use client";

import { useRef, useState } from "react";
import {
  imageStorage,
  uploadClubGalleryMedia,
  uploadProviderLogo,
  validateImageFile,
} from "@/lib/image-storage";
import { SafeImage } from "@/components/ui/SafeImage";

type ClubProfileImageUploadProps = {
  label: string;
  hint: string;
  aspect?: "square" | "banner";
  imageUrl: string | null;
  onChange: (url: string | null) => void;
  bucket?: "logo" | "cover";
};

export function ClubProfileImageUpload({
  label,
  hint,
  aspect = "square",
  imageUrl,
  onChange,
  bucket = "logo",
}: ClubProfileImageUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) {
      return;
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const previousUrl = imageUrl;
      const uploaded =
        bucket === "logo"
          ? await uploadProviderLogo(file)
          : await uploadClubGalleryMedia(file);
      onChange(uploaded.id);

      if (previousUrl && previousUrl !== uploaded.id) {
        await imageStorage.remove(previousUrl);
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

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => void handleFiles(event.target.files)}
      />

      <div
        className={`overflow-hidden rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 ${
          aspect === "banner" ? "min-h-36" : "aspect-square max-w-40"
        }`}
      >
        {imageUrl ? (
          <div className="relative h-full w-full">
            <SafeImage
              src={imageUrl}
              alt={label}
              className={`h-full w-full object-cover ${
                aspect === "banner" ? "min-h-36" : "aspect-square"
              }`}
            />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-4 py-6 text-center">
            <span className="text-2xl text-zinc-300">＋</span>
            <p className="mt-2 text-sm font-medium text-zinc-700">{label}</p>
            <p className="mt-1 text-xs text-zinc-500">{hint}</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-60"
        >
          {uploading ? "Uploading..." : imageUrl ? "Replace" : "Upload"}
        </button>
        {imageUrl ? (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setError(null);
            }}
            disabled={uploading}
            className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-60"
          >
            Remove
          </button>
        ) : null}
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

type ClubMediaFileUploadProps = {
  mediaType: "photo" | "video" | "highlight";
  imageUrl: string | null;
  onChange: (url: string) => void;
};

export function ClubMediaFileUpload({
  mediaType,
  imageUrl,
  onChange,
}: ClubMediaFileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const accept =
    mediaType === "video"
      ? "video/mp4,video/webm,.mp4,.webm"
      : ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const previousUrl = imageUrl;
      const uploaded = await uploadClubGalleryMedia(file, mediaType);
      onChange(uploaded.id);

      if (previousUrl && previousUrl !== uploaded.id) {
        await imageStorage.remove(previousUrl);
      }
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not upload this file.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => void handleFiles(event.target.files)}
      />

      <div className="flex aspect-square w-full max-w-[120px] flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-center">
        {imageUrl ? (
          mediaType === "video" ? (
            <video
              src={imageUrl}
              className="h-full w-full object-cover"
              controls
              preload="metadata"
            />
          ) : (
            <SafeImage
              src={imageUrl}
              alt={mediaType}
              className="h-full w-full object-cover"
            />
          )
        ) : (
          <div className="px-2 py-4">
            <span className="text-xl text-zinc-300">＋</span>
            <p className="mt-1 text-xs font-medium capitalize text-zinc-700">
              {mediaType}
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
      >
        {uploading ? "Uploading..." : imageUrl ? "Replace file" : "Upload file"}
      </button>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
