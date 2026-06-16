/** Public paths for Activora brand assets. */
export const BRAND_LOGO_FULL = "/branding/activora-logo.png";
export const BRAND_LOGO_COMPACT = "/branding/activora-logo-compact.png";
export const BRAND_MARK_PNG = "/branding/activora-mark.png";

/** Full horizontal logo with tagline (1024×506). */
export const BRAND_LOGO_FULL_WIDTH = 1024;
export const BRAND_LOGO_FULL_HEIGHT = 506;

/** Icon + wordmark, no tagline (1024×370). */
export const BRAND_LOGO_COMPACT_WIDTH = 1024;
export const BRAND_LOGO_COMPACT_HEIGHT = 370;

export const BRAND_MARK_SIZE = 506;

export const BRAND_TAGLINE_SHORT = "Every child. Every activity. Every day.";

/** Desktop header target height (px). */
export const LOGO_HEIGHT_DESKTOP = 42;
/** Mobile header target height (px). */
export const LOGO_HEIGHT_MOBILE = 34;

export function logoWidthForHeight(
  height: number,
  fullWidth: number,
  fullHeight: number,
): number {
  return Math.round((height / fullHeight) * fullWidth);
}
