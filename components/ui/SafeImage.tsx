"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";

export const IMAGE_UNAVAILABLE_LABEL = "Image unavailable";

const DEFAULT_FALLBACK_CLASSNAME =
  "flex h-full w-full items-center justify-center bg-gradient-to-br from-pink-50 to-zinc-100 px-2 text-center text-xs font-medium text-zinc-400";

export function isSupabaseUrl(src: string): boolean {
  try {
    return new URL(src).hostname.endsWith(".supabase.co");
  } catch {
    return src.includes("supabase.co");
  }
}

export function isValidImageSrc(src: string): boolean {
  const trimmed = src.trim();
  if (!trimmed) {
    return false;
  }

  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("blob:")
  ) {
    return true;
  }

  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Never route Supabase or other remote URLs through next/image. */
export function shouldUseNativeImage(src: string): boolean {
  if (src.startsWith("/")) {
    return false;
  }

  return (
    isSupabaseUrl(src) ||
    src.startsWith("data:") ||
    src.startsWith("blob:") ||
    src.startsWith("http://") ||
    src.startsWith("https://")
  );
}

export function ImageUnavailablePlaceholder({
  className = DEFAULT_FALLBACK_CLASSNAME,
  label = IMAGE_UNAVAILABLE_LABEL,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div className={className} role="img" aria-label={label}>
      {label}
    </div>
  );
}

type SafeImageProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  unoptimized?: boolean;
  style?: CSSProperties;
};

export function SafeImage({
  src,
  alt,
  className = "h-full w-full object-cover",
  fallbackClassName,
  fill = false,
  width,
  height,
  sizes = "(max-width: 768px) 100vw, 240px",
  priority = false,
  unoptimized = false,
  style,
}: SafeImageProps) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  const fallback = fallbackClassName ?? className ?? DEFAULT_FALLBACK_CLASSNAME;

  if (!src || !isValidImageSrc(src) || error) {
    return <ImageUnavailablePlaceholder className={fallback} />;
  }

  if (shouldUseNativeImage(src)) {
    return (
      <img
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        className={className}
        loading={priority ? "eager" : "lazy"}
        onError={() => setError(true)}
        style={style}
      />
    );
  }

  if (fill) {
    return (
      <div className="relative h-full w-full overflow-hidden">
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={unoptimized}
          className={className}
          onError={() => setError(true)}
        />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 48}
      height={height ?? 48}
      sizes={sizes}
      priority={priority}
      unoptimized={unoptimized}
      className={className}
      onError={() => setError(true)}
    />
  );
}
