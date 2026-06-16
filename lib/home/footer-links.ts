export const FOOTER_NAVY = "#0F172A";
export const FOOTER_TEAL = "#14B8A6";

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
  { label: "Accessibility", href: "/accessibility" },
];

export const FOOTER_PARENTS_LINKS: FooterLinkItem[] = [
  { label: "Find activities", href: "/sessions" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "FAQ", href: "/help/faq" },
  { label: "Contact", href: "/contact" },
];

export const FOOTER_PROVIDERS_LINKS: FooterLinkItem[] = [
  { label: "Get started", href: "/club/onboarding" },
  { label: "Book a demo", href: "/#book-demo" },
  { label: "Why Activora", href: "/#why-activora" },
  { label: "Report a bug", href: "/report-bug" },
];

export const FOOTER_COMPANY_LINKS: FooterLinkItem[] = [
  { label: "Careers", href: "/careers" },
  { label: "Partner with us", href: "/partnerships" },
  { label: "Status", href: "/status" },
  { label: "Security", href: "/security" },
  { label: "Accessibility", href: "/accessibility" },
  { label: "Updates", href: "/updates" },
];

export const FOOTER_SUPPORT_LINKS: FooterLinkItem[] = [
  { label: "Help centre", href: "/help/faq" },
  { label: "Contact", href: "/contact" },
  { label: "Report a bug", href: "/report-bug" },
  { label: "Request callback", href: "/contact?tab=callback" },
];

export const FOOTER_TRUST_LINKS: FooterLinkItem[] = [
  { label: "GDPR", href: "/security" },
  { label: "Stripe payments", href: "/security" },
  { label: "Built in UK", href: "/contact" },
  { label: "Support hours", href: "/contact" },
];

export const FOOTER_LINK_COLUMNS: FooterColumnConfig[] = [
  { id: "platform", title: "Platform", links: FOOTER_PLATFORM_LINKS },
  { id: "parents", title: "Parents", links: FOOTER_PARENTS_LINKS },
  { id: "providers", title: "Providers", links: FOOTER_PROVIDERS_LINKS },
  { id: "company", title: "Company", links: FOOTER_COMPANY_LINKS },
  { id: "support", title: "Support", links: FOOTER_SUPPORT_LINKS },
  { id: "trust", title: "Trust", links: FOOTER_TRUST_LINKS },
];

export const FOOTER_TRUST_BADGES = [
  "GDPR ready",
  "Stripe payments",
  "Built in UK",
] as const;

export type FooterBottomLink = {
  label: string;
  href: string;
  ariaLabel?: string;
};

export const FOOTER_BOTTOM_LINKS: FooterBottomLink[] = [];
