import { roleHasPermission } from "@/lib/admin/permissions";
import type { AdminRole } from "@/lib/admin/types";
import type { AdminUser, AdminUserRole } from "./types";

export const INVITABLE_ADMIN_ROLES: Exclude<AdminUserRole, "owner">[] = [
  "super_admin",
  "support_admin",
  "finance_admin",
  "content_admin",
];

export function canManageAdminUsers(role: AdminRole): boolean {
  return roleHasPermission(role, "manage_admins");
}

export function canAssignAdminRole(
  actorRole: AdminRole,
  targetRole: AdminUserRole,
): boolean {
  if (!canManageAdminUsers(actorRole)) {
    return false;
  }

  if (targetRole === "owner") {
    return actorRole === "owner";
  }

  return true;
}

export function canEditAdminUser(
  actorRole: AdminRole,
  target: Pick<AdminUser, "isOwner" | "role">,
): boolean {
  if (!canManageAdminUsers(actorRole)) {
    return false;
  }

  if (target.isOwner || target.role === "owner") {
    return actorRole === "owner";
  }

  return true;
}

export function canDisableAdminUser(
  actorRole: AdminRole,
  target: Pick<AdminUser, "isOwner" | "role">,
): boolean {
  if (!canEditAdminUser(actorRole, target)) {
    return false;
  }

  if (target.isOwner || target.role === "owner") {
    return false;
  }

  return true;
}
