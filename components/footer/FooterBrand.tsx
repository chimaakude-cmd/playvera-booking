"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { LanguageSelector } from "@/components/i18n/LanguageSelector";
import { Logo } from "@/components/branding";
import {
  FOOTER_SOCIAL_LINKS,
  FOOTER_TRUST_BADGES,
} from "@/constants/footer";
import { FOOTER_SUPPORT_HOURS } from "@/lib/callback-requests";
import { SocialPlatformIcon } from "@/components/club/public/SocialPlatformIcon";
import { useTranslation } from "@/lib/i18n";
import { FooterTrustBadges } from "./FooterTrustBadges";

export function FooterLogo() {
  return <Logo size={28} href="/" />;
}

export function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {FOOTER_SOCIAL_LINKS.map((social) => (
        <a
          key={social.platform}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={social.label}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 hover:text-white"
        >
          <SocialPlatformIcon platform={social.platform} className="h-4 w-4" />
        </a>
      ))}
    </div>
  );
}

export function FooterBrandColumn() {
  const { t } = useTranslation("footer");

  return (
    <div className="space-y-5 lg:col-span-2">
      <FooterLogo />
      <p className="max-w-xs text-sm leading-relaxed text-white/70">
        {t("brand.description")}
      </p>
      <SocialLinks />
      <FooterTrustBadges badges={FOOTER_TRUST_BADGES} />
      <p className="text-xs text-white/60">
        {t("contact.supportHoursLabel")} {FOOTER_SUPPORT_HOURS}
      </p>
      <div className="hidden lg:block">
        <LanguageSelector variant="footer" />
      </div>
    </div>
  );
}

export function FooterAccordionSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/10 lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-white">{title}</span>
        <ChevronDown
          className={`h-4 w-4 text-white/60 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      <div
        className={`grid transition-all duration-200 ${open ? "grid-rows-[1fr] pb-4 opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
