import Link from "next/link";
import {
  Accessibility,
  CreditCard,
  Heart,
  Landmark,
  Lock,
  MapPin,
  Receipt,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { FooterTrustBadge } from "@/constants/footer";
import { ACTIVORA_ACCENT } from "@/lib/home/constants";

const BADGE_ICONS: Record<FooterTrustBadge["icon"], LucideIcon> = {
  "shield-check": ShieldCheck,
  "credit-card": CreditCard,
  bank: Landmark,
  "map-pin": MapPin,
  lock: Lock,
  heart: Heart,
  receipt: Receipt,
  accessibility: Accessibility,
};

type FooterTrustBadgesProps = {
  badges: FooterTrustBadge[];
};

export function FooterTrustBadges({ badges }: FooterTrustBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => {
        const Icon = BADGE_ICONS[badge.icon] ?? ShieldCheck;
        return (
          <Link
            key={badge.label}
            href={badge.href}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/80 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <Icon className="h-3 w-3" style={{ color: ACTIVORA_ACCENT }} aria-hidden />
            {badge.label}
          </Link>
        );
      })}
    </div>
  );
}
