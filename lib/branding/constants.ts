/** Public paths for Activora brand assets. */
export const BRAND_LOGO_FULL = "/branding/activora-logo-compact.png";
export const BRAND_LOGO_COMPACT = "/branding/activora-logo-compact.png";
export const BRAND_MARK_PNG = "/branding/activora-mark.png";
export const BRAND_HERO = "/branding/activora-hero.png";

/** Trimmed wordmark (icons + ACTIVORA). Updated by `npm run generate:brand`. */
export const BRAND_LOGO_FULL_WIDTH = 287;
export const BRAND_LOGO_FULL_HEIGHT = 131;

/** Same asset as full — no separate tagline row in current artwork. */
export const BRAND_LOGO_COMPACT_WIDTH = BRAND_LOGO_FULL_WIDTH;
export const BRAND_LOGO_COMPACT_HEIGHT = BRAND_LOGO_FULL_HEIGHT;

export const BRAND_MARK_SIZE = 287;

export const BRAND_TAGLINE_SHORT = "Every child. Every activity. Every day.";

/** Desktop header target height (px) — matches h-10. */
export const LOGO_HEIGHT_DESKTOP = 40;
/** Mobile header target height (px) — matches h-8. */
export const LOGO_HEIGHT_MOBILE = 32;

export function logoWidthForHeight(
  height: number,
  fullWidth: number,
  fullHeight: number,
): number {
  return Math.round((height / fullHeight) * fullWidth);
}
