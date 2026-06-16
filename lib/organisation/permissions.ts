/**
 * Franchisor roles and franchisee lock policies.
 */

import type {
  FranchiseeEditableSetting,
  OrganisationRole,
} from "./types";

export type OrganisationPermission =
  | "view_dashboard"
  | "view_franchisee_clubs"
  | "create_franchisee_clubs"
  | "edit_franchisee_clubs"
  | "suspend_franchisee_clubs"
  | "remove_franchisee_clubs"
  | "assign_club_managers"
  | "edit_permission_policy"
  | "view_group_activities"
  | "view_group_bookings"
  | "view_group_registers"
  | "view_group_customers"
  | "view_group_communications"
  | "view_group_finance"
  | "view_group_reviews"
  | "manage_org_staff"
  | "manage_org_billing"
  | "manage_org_branding"
  | "manage_global_settings"
  | "view_group_reports";

export const ORGANISATION_ROLE_LABELS: Record<OrganisationRole, string> = {
  owner: "Organisation owner",
  admin: "Organisation admin",
  manager: "Regional manager",
  viewer: "Viewer",
};

export const ROLE_PERMISSIONS: Record<
  OrganisationRole,
  OrganisationPermission[]
> = {
  owner: [
    "view_dashboard",
    "view_franchisee_clubs",
    "create_franchisee_clubs",
    "edit_franchisee_clubs",
    "suspend_franchisee_clubs",
    "remove_franchisee_clubs",
    "assign_club_managers",
    "edit_permission_policy",
    "view_group_activities",
    "view_group_bookings",
    "view_group_registers",
    "view_group_customers",
    "view_group_communications",
    "view_group_finance",
    "view_group_reviews",
    "manage_org_staff",
    "manage_org_billing",
    "manage_org_branding",
    "manage_global_settings",
    "view_group_reports",
  ],
  admin: [
    "view_dashboard",
    "view_franchisee_clubs",
    "create_franchisee_clubs",
    "edit_franchisee_clubs",
    "suspend_franchisee_clubs",
    "assign_club_managers",
    "edit_permission_policy",
    "view_group_activities",
    "view_group_bookings",
    "view_group_registers",
    "view_group_customers",
    "view_group_communications",
    "view_group_finance",
    "view_group_reviews",
    "manage_org_staff",
    "view_group_reports",
  ],
  manager: [
    "view_dashboard",
    "view_franchisee_clubs",
    "edit_franchisee_clubs",
    "assign_club_managers",
    "view_group_activities",
    "view_group_bookings",
    "view_group_registers",
    "view_group_customers",
    "view_group_communications",
    "view_group_finance",
    "view_group_reviews",
    "view_group_reports",
  ],
  viewer: [
    "view_dashboard",
    "view_franchisee_clubs",
    "view_group_activities",
    "view_group_bookings",
    "view_group_registers",
    "view_group_customers",
    "view_group_communications",
    "view_group_finance",
    "view_group_reviews",
    "view_group_reports",
  ],
};

export const FRANCHISOR_ONLY_CONTROLS = [
  "Remove franchisee club from organisation",
  "Change franchisee permission policy",
  "Organisation billing and franchisor plan",
  "Franchisee payout schedule and franchisor fees",
  "Organisation branding and global settings",
  "Group-wide reports and analytics",
  "Suspend or reinstate franchisee clubs",
] as const;

export function orgRoleHasPermission(
  role: OrganisationRole,
  permission: OrganisationPermission,
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canFranchiseeEditSetting(
  setting: FranchiseeEditableSetting,
  policy: { franchiseeCanEdit: Record<FranchiseeEditableSetting, boolean> },
): boolean {
  return policy.franchiseeCanEdit[setting] ?? false;
}

export function getLockedSettingMessage(): string {
  return "Only your franchisor can change this setting.";
}
