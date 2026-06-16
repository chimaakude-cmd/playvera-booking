"use client";

import Link from "next/link";
import { ChevronDown, MapPin, Shield, ShieldCheck } from "lucide-react";
import { useState, type ReactNode } from "react";
import { LanguageSelector } from "@/components/i18n/LanguageSelector";
import { LogoMark } from "@/components/branding";
import { BRAND_NAME } from "@/lib/brand";
import { ACTIVORA_ACCENT } from "@/lib/home/constants";
import {
  FOOTER_BOTTOM_LINKS,
  FOOTER_LINK_COLUMNS,
  FOOTER_NAVY,
  FOOTER_SOCIAL_LINKS,
  FOOTER_TRUST_BADGES,
  type FooterLinkItem,
} from "@/lib/home/footer-links";
import { FOOTER_SUPPORT_HOURS } from "@/lib/callback-requests";
import { SocialPlatformIcon } from "@/components/club/public/SocialPlatformIcon";
import { translateFooterColumnTitle, useTranslation } from "@/lib/i18n";

function FooterLogo() {
  return (
    <Link
      href="/"
      className="group inline-flex shrink-0 items-center gap-2.5 transition-opacity duration-200 hover:opacity-90"
    >
      <LogoMark size={40} />
      <span className="text-xl font-bold tracking-tight text-white">{BRAND_NAME}</span>
    </Link>
  );
}

function FooterNavLink({
  item,
  className = "",
}: {
  item: FooterLinkItem;
  className?: string;
}) {
  const isExternal = item.external || item.href.startsWith("http");
  const isMailto = item.href.startsWith("mailto:");
  const linkClassName = `group/link relative inline-flex text-sm text-white/70 transition-all duration-200 hover:text-white hover:-translate-y-px ${className}`;

  const underline = (
    <span
      className="absolute -bottom-0.5 left-0 h-px w-0 transition-all duration-200 group-hover/link:w-full"
      style={{ backgroundColor: ACTIVORA_ACCENT }}
      aria-hidden
    />
  );

  if (isExternal || isMailto) {
    return (
      <a
        href={item.href}
        className={linkClassName}
        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {item.label}
        {underline}
      </a>
    );
  }

  return (
    <Link href={item.href} className={linkClassName}>
      {item.label}
      {underline}
    </Link>
  );
}

function FooterLinkList({ links }: { links: FooterLinkItem[] }) {
  return (
    <ul className="space-y-2.5">
      {links.map((item) => (
        <li key={`${item.label}-${item.href}`}>
          <FooterNavLink item={item} />
        </li>
      ))}
    </ul>
  );
}

function SocialLinks({ className = "" }: { className?: string }) {
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

function TrustBadges() {
  const icons = [ShieldCheck, Shield, MapPin] as const;

  return (
    <div className="flex flex-wrap gap-2">
      {FOOTER_TRUST_BADGES.map((badge, index) => {
        const Icon = icons[index] ?? ShieldCheck;
        return (
          <span
            key={badge}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/80"
          >
            <Icon className="h-3 w-3" style={{ color: ACTIVORA_ACCENT }} aria-hidden />
            {badge}
          </span>
        );
      })}
    </div>
  );
}

function FooterColumn({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white">
        {title}
      </h3>
      {children}
    </div>
  );
}

function FooterAccordionSection({
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

function FooterBrandColumn() {
  const { t } = useTranslation("footer");

  return (
    <div className="space-y-5 lg:col-span-2">
      <FooterLogo />
      <p className="max-w-xs text-sm leading-relaxed text-white/70">
        {t("brand.description")}
      </p>
      <SocialLinks />
      <TrustBadges />
      <p className="text-xs text-white/60">
        {t("contact.supportHoursLabel")} {FOOTER_SUPPORT_HOURS}
      </p>
      <div className="hidden lg:block">
        <LanguageSelector variant="footer" />
      </div>
    </div>
  );
}

export function SiteFooter() {
  const { t } = useTranslation("footer");

  return (
    <footer
      className="mt-auto text-white"
      style={{ backgroundColor: FOOTER_NAVY }}
      aria-label={t("siteFooter")}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="hidden pb-12 pt-14 lg:grid lg:grid-cols-8 lg:gap-8">
          <FooterBrandColumn />
          {FOOTER_LINK_COLUMNS.map((column) => (
            <FooterColumn
              key={column.id}
              title={translateFooterColumnTitle(column.id, column.title, t)}
            >
              <FooterLinkList links={column.links} />
            </FooterColumn>
          ))}
        </div>

        <div className="hidden pb-10 pt-12 md:block lg:hidden">
          <div className="mb-8">
            <FooterBrandColumn />
          </div>
          <div className="grid grid-cols-3 gap-8">
            {FOOTER_LINK_COLUMNS.map((column) => (
              <FooterColumn
                key={column.id}
                title={translateFooterColumnTitle(column.id, column.title, t)}
              >
                <FooterLinkList links={column.links} />
              </FooterColumn>
            ))}
          </div>
        </div>

        <div className="pb-8 pt-10 md:hidden">
          <div className="border-b border-white/10 pb-6">
            <FooterBrandColumn />
          </div>
          {FOOTER_LINK_COLUMNS.map((column, index) => (
            <FooterAccordionSection
              key={column.id}
              title={translateFooterColumnTitle(column.id, column.title, t)}
              defaultOpen={index === 0}
            >
              <FooterLinkList links={column.links} />
            </FooterAccordionSection>
          ))}
        </div>

        <div className="border-t border-white/10 py-6">
          <div className="flex flex-col items-center justify-between gap-4 text-xs text-white/50 sm:flex-row">
            <p>
              © {new Date().getFullYear()} {BRAND_NAME}
            </p>

            {FOOTER_BOTTOM_LINKS.length > 0 ? (
              <nav
                aria-label={t("bottom.legalNav")}
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
              {t("bottom.builtIn")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
