"use client";

import { useEffect, useState } from "react";
import { CATEGORY_FALLBACK_IMAGE } from "@/lib/home/category-images";

type CategoryCardImageProps = {
  src: string;
  alt: string;
};

export function CategoryCardImage({ src, alt }: CategoryCardImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
    setLoaded(false);
  }, [src]);

  return (
    <>
      {!loaded ? (
        <div className="category-card-shimmer absolute inset-0" aria-hidden />
      ) : null}
      <img
        src={currentSrc}
        alt={alt}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        loading="lazy"
        draggable={false}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (currentSrc !== CATEGORY_FALLBACK_IMAGE) {
            setCurrentSrc(CATEGORY_FALLBACK_IMAGE);
            setLoaded(false);
            return;
          }
          setLoaded(true);
        }}
      />
    </>
  );
}
