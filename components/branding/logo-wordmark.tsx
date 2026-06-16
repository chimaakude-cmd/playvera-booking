import Image from "next/image";
import {
  BRAND_LOGO_COMPACT,
  BRAND_LOGO_COMPACT_HEIGHT,
  BRAND_LOGO_COMPACT_WIDTH,
  logoWidthForHeight,
} from "@/lib/branding/constants";
import { BRAND_NAME } from "@/lib/brand";

type LogoWordmarkProps = {
  height?: number;
  className?: string;
  priority?: boolean;
};

/** Horizontal wordmark + icon (no tagline). */
export function LogoWordmark({
  height = 42,
  className = "",
  priority = false,
}: LogoWordmarkProps) {
  const width = logoWidthForHeight(
    height,
    BRAND_LOGO_COMPACT_WIDTH,
    BRAND_LOGO_COMPACT_HEIGHT,
  );

  return (
    <Image
      src={BRAND_LOGO_COMPACT}
      alt={BRAND_NAME}
      width={width}
      height={height}
      priority={priority}
      className={`shrink-0 object-contain object-left ${className}`}
    />
  );
}
