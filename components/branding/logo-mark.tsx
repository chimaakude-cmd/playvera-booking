import Image from "next/image";
import { BRAND_MARK_PNG } from "@/lib/branding/constants";
import { BRAND_NAME } from "@/lib/brand";

type LogoMarkProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export function LogoMark({
  size = 40,
  className = "",
  priority = false,
}: LogoMarkProps) {
  return (
    <Image
      src={BRAND_MARK_PNG}
      alt=""
      width={size}
      height={size}
      priority={priority}
      className={`shrink-0 object-contain ${className}`}
      aria-hidden
    />
  );
}

/** Accessible label when mark is used alone as a link target. */
export function logoMarkAriaLabel(): string {
  return BRAND_NAME;
}
