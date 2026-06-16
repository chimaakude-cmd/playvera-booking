"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import { resolveImagePreviewUrl } from "@/lib/session-images";

type SessionImageProps = {
  imageId: string | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  priority?: boolean;
  sizes?: string;
};

export function SessionImage({
  imageId,
  alt,
  className = "h-full w-full object-cover",
  fallbackClassName = "flex h-full w-full items-center justify-center bg-gradient-to-br from-pink-50 to-zinc-100 px-2 text-center text-xs font-medium text-zinc-400",
  priority = false,
  sizes = "(max-width: 768px) 100vw, 240px",
}: SessionImageProps) {
  const src = resolveImagePreviewUrl(imageId);

  return (
    <SafeImage
      src={src}
      alt={alt}
      fill
      className={className}
      fallbackClassName={fallbackClassName}
      priority={priority}
      sizes={sizes}
    />
  );
}

type SessionImageStripProps = {
  mainImageId: string | null | undefined;
  galleryImageIds?: string[];
  alt: string;
  className?: string;
};

export function SessionImageStrip({
  mainImageId,
  galleryImageIds = [],
  alt,
  className = "h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-zinc-200",
}: SessionImageStripProps) {
  const previewIds = [
    mainImageId,
    ...galleryImageIds.filter((id) => id !== mainImageId),
  ].filter((id): id is string => Boolean(id));

  if (previewIds.length === 0) {
    return (
      <div className={`${className} relative`}>
        <SessionImage imageId={null} alt={alt} />
      </div>
    );
  }

  return (
    <div className={`${className} grid grid-cols-2 gap-0.5 p-0.5`}>
      {previewIds.slice(0, 4).map((id, index) => (
        <div
          key={id}
          className={`relative overflow-hidden bg-zinc-100 ${
            previewIds.length === 1
              ? "col-span-2 row-span-2"
              : index === 0 && previewIds.length > 1
                ? "col-span-2"
                : ""
          }`}
        >
          <SessionImage
            imageId={id}
            alt={alt}
            className="object-cover"
            sizes="96px"
          />
        </div>
      ))}
    </div>
  );
}
