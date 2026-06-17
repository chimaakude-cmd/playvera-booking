import type { AdminRole } from "@/lib/admin/types";

/** Platform admin team roles — aligned with `AdminRole`. */
export type AdminUserRole = AdminRole;

export type AdminUserStatus = "invited" | "active" | "disabled";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  emailVerified: boolean;
  /** bcrypt-style hash; never exposed to clients. */
  passwordHash: string | null;
  inviteToken: string | null;
  inviteSentAt: string | null;
  acceptedAt: string | null;
  lastLoginAt: string | null;
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Public-safe user shape returned from API routes. */
export type AdminUserPublic = Omit<AdminUser, "passwordHash" | "inviteToken">;

export type AdminUsersState = {
  users: AdminUser[];
};

export type InviteAdminUserInput = {
  name: string;
  email: string;
  role: Exclude<AdminUserRole, "owner">;
};

export type UpdateAdminUserInput = {
  name?: string;
  email?: string;
  role?: AdminUserRole;
  status?: AdminUserStatus;
  emailVerified?: boolean;
  password?: string;
};

export type AdminUserAuditAction =
  | "invite_sent"
  | "password_changed"
  | "email_changed"
  | "role_changed"
  | "access_disabled"
  | "email_verified"
  | "invite_resent";

export type AdminUserAuditEntry = {
  id: string;
  action: AdminUserAuditAction;
  targetUserId: string;
  targetEmail: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  details?: string;
  createdAt: string;
};

export const ADMIN_USERS_STORAGE_KEY = "activora-admin-users";
export const ADMIN_USERS_AUDIT_KEY = "activora-admin-users-audit";

export const ADMIN_USER_STATUS_LABELS: Record<AdminUserStatus, string> = {
  invited: "Invited",
  active: "Active",
  disabled: "Disabled",
};

export function toPublicAdminUser(user: AdminUser): AdminUserPublic {
  const { passwordHash: _passwordHash, inviteToken: _inviteToken, ...rest } = user;
  return rest;
}

export function formatAdminLastLogin(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
