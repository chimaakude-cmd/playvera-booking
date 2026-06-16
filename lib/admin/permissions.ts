import type { AdminNavSection, AdminRole } from "./types";

export type AdminPermission =
  | "view_dashboard"
  | "manage_providers"
  | "view_provider_finance"
  | "suspend_providers"
  | "verify_providers"
  | "manage_activities"
  | "manage_bookings"
  | "view_bookings_payment"
  | "manage_messages"
  | "manage_bugs"
  | "manage_careers"
  | "manage_partnerships"
  | "manage_partners"
  | "manage_contact"
  | "manage_releases"
  | "manage_translations"
  | "manage_communications"
  | "manage_reviews"
  | "view_finance"
  | "manage_stripe"
  | "manage_platform_fees"
  | "view_payouts"
  | "view_disputes"
  | "manage_invoices"
  | "manage_settings"
  | "manage_admins"
  | "export_finance";

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  owner: "Owner",
  super_admin: "Super Admin",
  support_admin: "Support Admin",
  finance_admin: "Finance Admin",
  content_admin: "Content Admin",
};

const FULL_PLATFORM_PERMISSIONS: AdminPermission[] = [
  "view_dashboard",
  "manage_providers",
  "view_provider_finance",
  "suspend_providers",
  "verify_providers",
  "manage_activities",
  "manage_bookings",
  "view_bookings_payment",
  "manage_messages",
  "manage_bugs",
  "manage_careers",
  "manage_partnerships",
  "manage_partners",
  "manage_contact",
  "manage_releases",
  "manage_translations",
  "manage_communications",
  "manage_reviews",
  "view_finance",
  "manage_stripe",
  "manage_platform_fees",
  "view_payouts",
  "view_disputes",
  "manage_invoices",
  "manage_settings",
  "manage_admins",
  "export_finance",
];

export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  owner: FULL_PLATFORM_PERMISSIONS,
  super_admin: FULL_PLATFORM_PERMISSIONS,
  finance_admin: [
    "view_dashboard",
    "view_provider_finance",
    "view_finance",
    "manage_stripe",
    "manage_platform_fees",
    "view_payouts",
    "view_disputes",
    "manage_invoices",
    "view_bookings_payment",
    "manage_bookings",
    "export_finance",
  ],
  support_admin: [
    "view_dashboard",
    "manage_providers",
    "suspend_providers",
    "verify_providers",
    "manage_activities",
    "manage_bookings",
    "manage_messages",
    "manage_bugs",
    "manage_reviews",
  ],
  content_admin: [
    "view_dashboard",
    "manage_careers",
    "manage_partnerships",
    "manage_partners",
    "manage_releases",
    "manage_translations",
    "manage_communications",
  ],
};

export const ROLE_NAV_SECTIONS: Record<AdminRole, AdminNavSection[]> = {
  owner: [
    "dashboard",
    "providers",
    "activities",
    "bookings",
    "messages",
    "bugs",
    "careers",
    "partnerships",
    "partners",
    "contact",
    "releases",
    "translations",
    "communications",
    "reviews",
    "finance",
    "settings",
    "users",
  ],
  super_admin: [
    "dashboard",
    "providers",
    "activities",
    "bookings",
    "messages",
    "bugs",
    "careers",
    "partnerships",
    "partners",
    "contact",
    "releases",
    "translations",
    "communications",
    "reviews",
    "finance",
    "settings",
    "users",
  ],
  finance_admin: ["dashboard", "providers", "bookings", "finance"],
  support_admin: [
    "dashboard",
    "providers",
    "activities",
    "bookings",
    "messages",
    "bugs",
    "reviews",
  ],
  content_admin: [
    "dashboard",
    "careers",
    "partnerships",
    "partners",
    "releases",
    "translations",
    "communications",
  ],
};

export type AdminNavItem = {
  section: AdminNavSection;
  href: string;
  label: string;
  group: string;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    section: "dashboard",
    href: "/admin/dashboard",
    label: "Dashboard",
    group: "Platform",
  },
  {
    section: "providers",
    href: "/admin/providers",
    label: "Providers",
    group: "Operations",
  },
  {
    section: "activities",
    href: "/admin/activities",
    label: "Activities",
    group: "Operations",
  },
  {
    section: "bookings",
    href: "/admin/bookings",
    label: "Bookings",
    group: "Operations",
  },
  {
    section: "messages",
    href: "/admin/messages",
    label: "Messages",
    group: "Support",
  },
  {
    section: "bugs",
    href: "/admin/bugs",
    label: "Bug reports",
    group: "Support",
  },
  {
    section: "careers",
    href: "/admin/careers",
    label: "Careers",
    group: "Support",
  },
  {
    section: "partnerships",
    href: "/admin/partnerships",
    label: "Partnerships",
    group: "Support",
  },
  {
    section: "partners",
    href: "/admin/partners",
    label: "Partner Directory",
    group: "Support",
  },
  {
    section: "contact",
    href: "/admin/contact",
    label: "Callback requests",
    group: "Support",
  },
  {
    section: "releases",
    href: "/admin/releases",
    label: "Release Notes",
    group: "Platform",
  },
  {
    section: "translations",
    href: "/admin/translations",
    label: "Translations",
    group: "Platform",
  },
  {
    section: "communications",
    href: "/admin/platform/communications",
    label: "Default templates",
    group: "Platform",
  },
  {
    section: "reviews",
    href: "/admin/reviews",
    label: "Reviews",
    group: "Support",
  },
  {
    section: "finance",
    href: "/admin/finance",
    label: "Finance",
    group: "Business",
  },
  {
    section: "settings",
    href: "/admin/settings",
    label: "Settings",
    group: "System",
  },
  {
    section: "users",
    href: "/admin/users",
    label: "Admin Users",
    group: "System",
  },
];

export function roleHasPermission(
  role: AdminRole,
  permission: AdminPermission,
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canAccessNavSection(
  role: AdminRole,
  section: AdminNavSection,
): boolean {
  return ROLE_NAV_SECTIONS[role].includes(section);
}

export function getNavGroupsForRole(
  role: AdminRole,
): Array<{ title: string; items: AdminNavItem[] }> {
  const items = ADMIN_NAV_ITEMS.filter((item) =>
    canAccessNavSection(role, item.section),
  );
  const groups = new Map<string, AdminNavItem[]>();

  for (const item of items) {
    const existing = groups.get(item.group) ?? [];
    existing.push(item);
    groups.set(item.group, existing);
  }

  return Array.from(groups.entries()).map(([title, groupItems]) => ({
    title,
    items: groupItems,
  }));
}
