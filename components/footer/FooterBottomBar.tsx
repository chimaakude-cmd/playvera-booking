import Link from "next/link";
import { MapPin } from "lucide-react";
import {
  FOOTER_BOTTOM_LINKS,
  FOOTER_COPYRIGHT_YEAR,
  FOOTER_NAVY,
} from "@/constants/footer";
import { BRAND_NAME } from "@/lib/brand";
import { ACTIVORA_ACCENT } from "@/lib/home/constants";

type FooterBottomBarProps = {
  legalNavLabel: string;
  builtInLabel: string;
};

export function FooterBottomBar({ legalNavLabel, builtInLabel }: FooterBottomBarProps) {
  return (
    <div className="border-t border-white/10 py-6">
      <div className="flex flex-col items-center justify-between gap-4 text-xs text-white/50 sm:flex-row">
        <p>
          © {FOOTER_COPYRIGHT_YEAR} {BRAND_NAME}
        </p>

        {FOOTER_BOTTOM_LINKS.length > 0 ? (
          <nav
            aria-label={legalNavLabel}
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
          >
            {FOOTER_BOTTOM_LINKS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                aria-label={item.ariaLabel}
                className="relative text-white/50 transition-colors duration-200 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}

        <p className="inline-flex items-center gap-1.5 text-white/50">
          <MapPin className="h-3.5 w-3.5" style={{ color: ACTIVORA_ACCENT }} aria-hidden />
          {builtInLabel}
        </p>
      </div>
    </div>
  );
}

export { FOOTER_NAVY };
