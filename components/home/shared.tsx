import type { ReactNode } from "react";

export function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-sm font-semibold text-[#0F172A]">
      <span className="text-amber-400">★</span>
      {rating.toFixed(1)}
    </span>
  );
}

export function SectionHeading({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={`text-xl font-bold text-[#0F172A] sm:text-2xl ${className}`}>
      {children}
    </h2>
  );
}

/** Consistent homepage section spacing */
export const HOME_SECTION = "py-24 lg:py-[120px]";
export const HOME_CARD = "rounded-[20px]";
export const HOME_BUTTON = "rounded-xl";
export const HOME_SHADOW =
  "shadow-[0_8px_32px_rgba(15,23,42,0.06)]";
export const HOME_SHADOW_LG =
  "shadow-[0_16px_48px_rgba(15,23,42,0.08)]";
