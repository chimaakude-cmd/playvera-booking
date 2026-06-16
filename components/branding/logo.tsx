import Link from "next/link";
import Image from "next/image";
import {
  BRAND_LOGO_COMPACT,
  BRAND_LOGO_COMPACT_HEIGHT,
  BRAND_LOGO_COMPACT_WIDTH,
  BRAND_LOGO_FULL,
  BRAND_LOGO_FULL_HEIGHT,
  BRAND_LOGO_FULL_WIDTH,
  LOGO_HEIGHT_DESKTOP,
  LOGO_HEIGHT_MOBILE,
  logoWidthForHeight,
} from "@/lib/branding/constants";
import { BRAND_NAME } from "@/lib/brand";

export type LogoSize = "mobile" | "desktop" | number;

type LogoProps = {
  size?: LogoSize;
  showTagline?: boolean;
  href?: string | null;
  className?: string;
  priority?: boolean;
  onClick?: () => void;
};

function resolveHeight(size: LogoSize): number {
  if (size === "mobile") return LOGO_HEIGHT_MOBILE;
  if (size === "desktop") return LOGO_HEIGHT_DESKTOP;
  return size;
}

export function Logo({
  size = "desktop",
  showTagline = false,
  href = "/",
  className = "",
  priority = false,
  onClick,
}: LogoProps) {
  const height = resolveHeight(size);
  const src = showTagline ? BRAND_LOGO_FULL : BRAND_LOGO_COMPACT;
  const sourceHeight = showTagline
    ? BRAND_LOGO_FULL_HEIGHT
    : BRAND_LOGO_COMPACT_HEIGHT;
  const sourceWidth = showTagline
    ? BRAND_LOGO_FULL_WIDTH
    : BRAND_LOGO_COMPACT_WIDTH;
  const width = logoWidthForHeight(height, sourceWidth, sourceHeight);

  const image = (
    <Image
      src={src}
      alt={BRAND_NAME}
      width={width}
      height={height}
      priority={priority}
      className={`shrink-0 object-contain object-left transition-opacity duration-200 hover:opacity-90 ${className}`}
    />
  );

  if (href === null) {
    return image;
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className="inline-flex shrink-0 items-center transition-opacity duration-200 hover:opacity-90"
      aria-label={BRAND_NAME}
    >
      {image}
    </Link>
  );
}

/** @deprecated Use Logo from @/components/branding/logo */
export function ActivoraLogo(
  props: Omit<LogoProps, "size"> & { size?: LogoSize },
) {
  return <Logo size={props.size ?? "desktop"} {...props} />;
}
