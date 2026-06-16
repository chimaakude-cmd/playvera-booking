/**
 * Standardised club team roles and permissions.
 *
 * Storage (today): localStorage `activora-club-team`
 * Database: future `club_team_members` + `club_team_invites` tables
 */

export type ClubRole = "coach" | "administrator" | "manager" | "owner";

export type ClubPermission =
  | "view_dashboard"
  | "view_assigned_sessions"
  | "view_registers"
  | "mark_attendance"
  | "view_child_name"
  | "view_emergency_contact"
  | "view_medical_notes"
  | "view_activities"
  | "create_activities"
  | "edit_activities"
  | "delete_activities"
  | "manage_bookings"
  | "export_registers"
  | "view_customers"
  | "edit_club_profile"
  | "view_communications"
  | "manage_communications"
  | "view_inbox"
  | "view_discounts"
  | "manage_discounts"
  | "view_basic_finance"
  | "view_detailed_finance"
  | "invite_staff"
  | "manage_team"
  | "manage_venues"
  | "change_subscription"
  | "change_billing"
  | "remove_owner"
  | "delete_club"
  | "transfer_ownership"
  | "view_payments"
  | "view_parent_payment_status"
  | "view_revenue"
  | "change_settings"
  | "full_finance_controls";

export type ClubNavSection =
  | "dashboard"
  | "activities"
  | "bookings"
  | "registers"
  | "customers"
  | "communications"
  | "inbox"
  | "discounts"
  | "partners"
  | "website_widget"
  | "shares"
  | "reviews"
  | "finance"
  | "club_profile"
  | "settings"
  | "team_access";

export const CLUB_ROLE_LABELS: Record<ClubRole, string> = {
  coach: "Coach",
  administrator: "Administrator",
  manager: "Manager",
  owner: "Owner",
};

export const INVITABLE_ROLES: ClubRole[] = [
  "coach",
  "administrator",
  "manager",
];

export const ROLE_PERMISSIONS: Record<ClubRole, ClubPermission[]> = {
  coach: [
    "view_dashboard",
    "view_assigned_sessions",
    "view_registers",
    "mark_attendance",
    "view_child_name",
    "view_emergency_contact",
    "view_medical_notes",
  ],
  administrator: [
    "view_dashboard",
    "view_activities",
    "create_activities",
    "edit_activities",
    "manage_bookings",
    "view_registers",
    "mark_attendance",
    "export_registers",
    "view_child_name",
    "view_emergency_contact",
    "view_medical_notes",
    "view_customers",
    "edit_club_profile",
    "view_communications",
    "view_inbox",
    "view_discounts",
    "manage_discounts",
    "view_basic_finance",
    "change_settings",
  ],
  manager: [
    "view_dashboard",
    "view_activities",
    "create_activities",
    "edit_activities",
    "delete_activities",
    "manage_bookings",
    "view_registers",
    "mark_attendance",
    "export_registers",
    "view_child_name",
    "view_emergency_contact",
    "view_medical_notes",
    "view_customers",
    "edit_club_profile",
    "view_communications",
    "manage_communications",
    "view_inbox",
    "view_discounts",
    "manage_discounts",
    "view_basic_finance",
    "view_detailed_finance",
    "invite_staff",
    "manage_team",
    "manage_venues",
    "change_settings",
    "view_payments",
    "view_parent_payment_status",
    "view_revenue",
  ],
  owner: [
    "view_dashboard",
    "view_assigned_sessions",
    "view_activities",
    "create_activities",
    "edit_activities",
    "delete_activities",
    "manage_bookings",
    "view_registers",
    "mark_attendance",
    "export_registers",
    "view_child_name",
    "view_emergency_contact",
    "view_medical_notes",
    "view_customers",
    "edit_club_profile",
    "view_communications",
    "manage_communications",
    "view_inbox",
    "view_discounts",
    "manage_discounts",
    "view_basic_finance",
    "view_detailed_finance",
    "full_finance_controls",
    "invite_staff",
    "manage_team",
    "manage_venues",
    "change_subscription",
    "change_billing",
    "delete_club",
    "transfer_ownership",
    "view_payments",
    "view_parent_payment_status",
    "view_revenue",
    "change_settings",
    "remove_owner",
  ],
};

export const ROLE_NAV_SECTIONS: Record<ClubRole, ClubNavSection[]> = {
  coach: ["dashboard", "registers", "activities"],
  administrator: [
    "dashboard",
    "inbox",
    "activities",
    "bookings",
    "registers",
    "customers",
    "communications",
    "discounts",
    "partners",
    "website_widget",
    "shares",
    "reviews",
    "club_profile",
  ],
  manager: [
    "dashboard",
    "inbox",
    "activities",
    "bookings",
    "registers",
    "customers",
    "communications",
    "discounts",
    "partners",
    "website_widget",
    "shares",
    "reviews",
    "finance",
    "club_profile",
    "settings",
    "team_access",
  ],
  owner: [
    "dashboard",
    "inbox",
    "activities",
    "bookings",
    "registers",
    "customers",
    "communications",
    "discounts",
    "partners",
    "website_widget",
    "shares",
    "reviews",
    "finance",
    "club_profile",
    "settings",
    "team_access",
  ],
};

export type ClubNavItem = {
  section: ClubNavSection;
  href: string;
  label: string;
  group: string;
  soon?: boolean;
  badgeKey?: "inbox";
};

export const CLUB_NAV_ITEMS: ClubNavItem[] = [
  { section: "dashboard", href: "/club/dashboard", label: "Dashboard", group: "Overview" },
  { section: "inbox", href: "/club/inbox", label: "Inbox", group: "Overview", badgeKey: "inbox" },
  { section: "activities", href: "/club/activities", label: "Activities", group: "Operations" },
  { section: "bookings", href: "/club/bookings", label: "Bookings", group: "Operations" },
  { section: "registers", href: "/club/registers", label: "Registers", group: "Operations" },
  { section: "customers", href: "/club/customers", label: "Customers", group: "Growth" },
  { section: "communications", href: "/club/communications", label: "Communications", group: "Growth" },
  { section: "discounts", href: "/club/discounts", label: "Discounts", group: "Growth" },
  { section: "partners", href: "/club/partners", label: "Provider benefits", group: "Growth" },
  { section: "website_widget", href: "/club/growth/website-widget", label: "Website widget", group: "Growth" },
  { section: "shares", href: "/club/growth/shares", label: "Shares", group: "Growth" },
  { section: "reviews", href: "/club/reviews", label: "Reviews", group: "Growth" },
  { section: "finance", href: "/club/finance", label: "Finance", group: "Business" },
  { section: "settings", href: "/club/settings", label: "Settings", group: "Business" },
  { section: "club_profile", href: "/club/settings/profile", label: "Club profile", group: "Business" },
  { section: "team_access", href: "/club/settings/team", label: "Account & team", group: "Business" },
];

export function roleHasPermission(
  role: ClubRole,
  permission: ClubPermission,
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canAccessNavSection(
  role: ClubRole,
  section: ClubNavSection,
): boolean {
  return ROLE_NAV_SECTIONS[role].includes(section);
}

export function getNavItemsForRole(role: ClubRole): ClubNavItem[] {
  return CLUB_NAV_ITEMS.filter((item) => canAccessNavSection(role, item.section));
}

export function getNavGroupsForRole(
  role: ClubRole,
): Array<{ title: string; items: ClubNavItem[] }> {
  const items = getNavItemsForRole(role);
  const groups = new Map<string, ClubNavItem[]>();

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
