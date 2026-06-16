import type { AdminUser, AdminUserAuditEntry, AdminUserRole } from "./types";

export type AdminUserRow = {
  id: string;
  auth_user_id: string | null;
  name: string;
  email: string;
  role: AdminUserRole;
  status: AdminUser["status"];
  email_verified: boolean;
  password_hash: string | null;
  invite_token: string | null;
  invite_sent_at: string | null;
  last_login_at: string | null;
  is_owner: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminUserAuditRow = {
  id: string;
  action: AdminUserAuditEntry["action"];
  target_user_id: string | null;
  target_email: string;
  actor_id: string;
  actor_name: string;
  actor_email: string;
  details: string | null;
  created_at: string;
};

export function rowToAdminUser(row: AdminUserRow): AdminUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    emailVerified: row.email_verified,
    passwordHash: row.password_hash,
    inviteToken: row.invite_token,
    inviteSentAt: row.invite_sent_at,
    lastLoginAt: row.last_login_at,
    isOwner: row.is_owner,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToAuditEntry(row: AdminUserAuditRow): AdminUserAuditEntry {
  return {
    id: row.id,
    action: row.action,
    targetUserId: row.target_user_id ?? "",
    targetEmail: row.target_email,
    actorId: row.actor_id,
    actorName: row.actor_name,
    actorEmail: row.actor_email,
    details: row.details ?? undefined,
    createdAt: row.created_at,
  };
}
