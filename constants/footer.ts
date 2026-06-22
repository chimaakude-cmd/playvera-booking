export const FOOTER_NAVY = "#0F172A";
export const FOOTER_TEAL = "#14B8A6";
export const FOOTER_COPYRIGHT_YEAR = 2026;

export type FooterLinkItem = {
  label: string;
  href: string;
  external?: boolean;
};

export type FooterColumnConfig = {
  id: string;
  title: string;
  links: FooterLinkItem[];
};

export const FOOTER_SOCIAL_LINKS = [
  {
    platform: "instagram" as const,
    href: "https://instagram.com/activora",
    label: "Instagram",
  },
  {
    platform: "facebook" as const,
    href: "https://facebook.com/activora",
    label: "Facebook",
  },
  {
    platform: "linkedin" as const,
    href: "https://linkedin.com/company/activora",
    label: "LinkedIn",
  },
  {
    platform: "youtube" as const,
    href: "https://youtube.com/@activora",
    label: "YouTube",
  },
] as const;

export const FOOTER_PLATFORM_LINKS: FooterLinkItem[] = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "What's new", href: "/updates" },
  { label: "Status", href: "/status" },
  { label: "Security", href: "/security" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Accessibility", href: "/accessibility" },
];

export const FOOTER_PARENTS_LINKS: FooterLinkItem[] = [
  { label: "Find activities", href: "/sessions" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "FAQ", href: "/help/faq" },
  { label: "Parent Safety", href: "/parents/safety" },
  { label: "Refund Policy", href: "/parents/refunds" },
  { label: "Booking Protection", href: "/parents/booking-protection" },
  { label: "Contact", href: "/contact" },
];

export const FOOTER_PROVIDERS_LINKS: FooterLinkItem[] = [
  { label: "Get started", href: "/get-started" },
  { label: "Pricing", href: "/providers/pricing" },
  { label: "Book a demo", href: "/contact?topic=demo" },
  { label: "Why Activora", href: "/#why-activora" },
  { label: "Integrations", href: "/providers/integrations" },
  { label: "Migration support", href: "/providers/migration" },
  { label: "Report a bug", href: "/report-bug" },
];

export const FOOTER_COMPANY_LINKS: FooterLinkItem[] = [
  { label: "About Activora", href: "/company/about" },
  { label: "Careers", href: "/careers" },
  { label: "Partner with us", href: "/partnerships" },
  { label: "Updates", href: "/updates" },
  { label: "Roadmap", href: "/company/roadmap" },
  { label: "Accessibility", href: "/accessibility" },
];

export const FOOTER_SUPPORT_LINKS: FooterLinkItem[] = [
  { label: "Help centre", href: "/help/faq" },
  { label: "Knowledge base", href: "/support/knowledge-base" },
  { label: "Contact", href: "/contact" },
  { label: "Request callback", href: "/contact?tab=callback" },
  { label: "Release notes", href: "/support/releases" },
  { label: "Feature requests", href: "/support/feature-requests" },
  { label: "Report a bug", href: "/report-bug" },
];

export const FOOTER_TRUST_LINKS: FooterLinkItem[] = [
  { label: "GDPR", href: "/trust/gdpr" },
  { label: "Terms", href: "/trust/terms" },
  { label: "Cookie Policy", href: "/trust/cookies" },
  { label: "DPA", href: "/trust/dpa" },
  { label: "Data Storage & Security", href: "/trust/security" },
  { label: "Safeguarding", href: "/trust/safeguarding" },
  { label: "Stripe", href: "/trust/stripe-payments" },
  { label: "GoCardless", href: "/trust/gocardless-payments" },
  { label: "Built in UK", href: "/trust/built-in-uk" },
  { label: "Support hours", href: "/trust/support-hours" },
  { label: "System status", href: "/status" },
];

export type FooterTrustBadge = {
  label: string;
  href: string;
  icon: "shield-check" | "credit-card" | "bank" | "map-pin" | "lock" | "heart" | "receipt" | "accessibility";
};

export const FOOTER_TRUST_BADGES: FooterTrustBadge[] = [
  { label: "GDPR ready", href: "/trust/gdpr", icon: "shield-check" },
  { label: "Stripe", href: "/trust/stripe-payments", icon: "credit-card" },
  { label: "GoCardless", href: "/trust/gocardless-payments", icon: "bank" },
  { label: "Built in UK", href: "/trust/built-in-uk", icon: "map-pin" },
  { label: "Secure payments", href: "/trust/security", icon: "lock" },
  { label: "Parent focused", href: "/parents/safety", icon: "heart" },
  { label: "Transparent pricing", href: "/providers/pricing", icon: "receipt" },
  { label: "Accessibility", href: "/accessibility", icon: "accessibility" },
];

export const FOOTER_LINK_COLUMNS: FooterColumnConfig[] = [
  { id: "platform", title: "Platform", links: FOOTER_PLATFORM_LINKS },
  { id: "parents", title: "Parents", links: FOOTER_PARENTS_LINKS },
  { id: "providers", title: "Providers", links: FOOTER_PROVIDERS_LINKS },
  { id: "company", title: "Company", links: FOOTER_COMPANY_LINKS },
  { id: "support", title: "Support", links: FOOTER_SUPPORT_LINKS },
  { id: "trust", title: "Trust", links: FOOTER_TRUST_LINKS },
];

export type FooterBottomLink = {
  label: string;
  href: string;
  ariaLabel?: string;
};

export const FOOTER_BOTTOM_LINKS: FooterBottomLink[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/trust/terms" },
  { label: "Security", href: "/security" },
  { label: "Accessibility", href: "/accessibility" },
  { label: "Cookies", href: "/trust/cookies" },
  { label: "Status", href: "/status" },
  { label: "DPA", href: "/trust/dpa" },
];
