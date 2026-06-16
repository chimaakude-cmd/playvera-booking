import { ADMIN_USERS_STORAGE_KEY } from "./types";
import { SEED_ADMIN_USERS_STATE } from "./defaults";
import { generateInviteToken } from "./invite-link";
import type {
  AdminUser,
  AdminUsersState,
  InviteAdminUserInput,
  UpdateAdminUserInput,
} from "./types";
import { toPublicAdminUser } from "./types";
import {
  canAssignAdminRole,
  canDisableAdminUser,
  canEditAdminUser,
} from "./permissions";
import { appendAdminUserAuditLog } from "./audit";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeState(raw: Partial<AdminUsersState>): AdminUsersState {
  return {
    users: raw.users?.length ? raw.users : SEED_ADMIN_USERS_STATE.users,
  };
}

export function getAdminUsersState(): AdminUsersState {
  if (!isBrowser()) {
    return SEED_ADMIN_USERS_STATE;
  }

  try {
    const raw = localStorage.getItem(ADMIN_USERS_STORAGE_KEY);
    if (!raw) {
      return SEED_ADMIN_USERS_STATE;
    }
    return normalizeState(JSON.parse(raw) as Partial<AdminUsersState>);
  } catch {
    return SEED_ADMIN_USERS_STATE;
  }
}

function saveAdminUsersState(state: AdminUsersState): void {
  if (isBrowser()) {
    localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(state));
  }
}

export function getAdminUserById(id: string): AdminUser | null {
  const state = getAdminUsersState();
  return state.users.find((user) => user.id === id) ?? null;
}

export type AdminUserActor = {
  adminId: string;
  email: string;
  name: string;
  role: AdminUser["role"];
};

export function inviteAdminUser(
  input: InviteAdminUserInput,
  actor: AdminUserActor,
): { user: ReturnType<typeof toPublicAdminUser>; inviteToken: string } {
  if (!canAssignAdminRole(actor.role, input.role)) {
    throw new Error("You do not have permission to assign this role.");
  }

  const state = getAdminUsersState();
  const normalizedEmail = input.email.trim().toLowerCase();
  const duplicate = state.users.find(
    (user) => user.email.toLowerCase() === normalizedEmail && user.status !== "disabled",
  );
  if (duplicate) {
    throw new Error("An admin user with this email already exists.");
  }

  const now = nowIso();
  const inviteToken = generateInviteToken();
  const user: AdminUser = {
    id: createId("admin"),
    name: input.name.trim(),
    email: normalizedEmail,
    role: input.role,
    status: "invited",
    emailVerified: false,
    passwordHash: null,
    inviteToken,
    inviteSentAt: now,
    lastLoginAt: null,
    isOwner: false,
    createdAt: now,
    updatedAt: now,
  };

  state.users = [user, ...state.users];
  saveAdminUsersState(state);

  appendAdminUserAuditLog({
    action: "invite_sent",
    targetUserId: user.id,
    targetEmail: user.email,
    actorId: actor.adminId,
    actorName: actor.name,
    actorEmail: actor.email,
    details: `Invited as ${input.role}`,
  });

  return { user: toPublicAdminUser(user), inviteToken };
}

export function resendAdminInvite(
  userId: string,
  actor: AdminUserActor,
): { user: ReturnType<typeof toPublicAdminUser>; inviteToken: string } {
  const state = getAdminUsersState();
  const user = state.users.find((item) => item.id === userId);
  if (!user || user.status !== "invited") {
    throw new Error("Invited admin user not found.");
  }
  if (!canEditAdminUser(actor.role, user)) {
    throw new Error("You do not have permission to resend this invite.");
  }

  const now = nowIso();
  user.inviteToken = generateInviteToken();
  user.inviteSentAt = now;
  user.updatedAt = now;
  saveAdminUsersState(state);

  appendAdminUserAuditLog({
    action: "invite_resent",
    targetUserId: user.id,
    targetEmail: user.email,
    actorId: actor.adminId,
    actorName: actor.name,
    actorEmail: actor.email,
  });

  return { user: toPublicAdminUser(user), inviteToken: user.inviteToken };
}

export function updateAdminUserLocal(
  userId: string,
  input: UpdateAdminUserInput,
  actor: AdminUserActor,
): ReturnType<typeof toPublicAdminUser> {
  const state = getAdminUsersState();
  const user = state.users.find((item) => item.id === userId);
  if (!user) {
    throw new Error("Admin user not found.");
  }
  if (!canEditAdminUser(actor.role, user)) {
    throw new Error("You do not have permission to edit this admin user.");
  }

  const now = nowIso();

  if (input.email && input.email.trim().toLowerCase() !== user.email) {
    const normalized = input.email.trim().toLowerCase();
    const duplicate = state.users.find(
      (item) =>
        item.id !== user.id &&
        item.email.toLowerCase() === normalized &&
        item.status !== "disabled",
    );
    if (duplicate) {
      throw new Error("An admin user with this email already exists.");
    }
    appendAdminUserAuditLog({
      action: "email_changed",
      targetUserId: user.id,
      targetEmail: normalized,
      actorId: actor.adminId,
      actorName: actor.name,
      actorEmail: actor.email,
      details: `Changed from ${user.email}`,
    });
    user.email = normalized;
  }

  if (input.name?.trim()) {
    user.name = input.name.trim();
  }

  if (input.role && input.role !== user.role) {
    if (!canAssignAdminRole(actor.role, input.role)) {
      throw new Error("You do not have permission to assign this role.");
    }
    appendAdminUserAuditLog({
      action: "role_changed",
      targetUserId: user.id,
      targetEmail: user.email,
      actorId: actor.adminId,
      actorName: actor.name,
      actorEmail: actor.email,
      details: `Changed from ${user.role} to ${input.role}`,
    });
    user.role = input.role;
  }

  if (typeof input.emailVerified === "boolean" && input.emailVerified !== user.emailVerified) {
    user.emailVerified = input.emailVerified;
    if (input.emailVerified) {
      appendAdminUserAuditLog({
        action: "email_verified",
        targetUserId: user.id,
        targetEmail: user.email,
        actorId: actor.adminId,
        actorName: actor.name,
        actorEmail: actor.email,
      });
    }
  }

  if (input.status && input.status !== user.status) {
    if (input.status === "disabled" && !canDisableAdminUser(actor.role, user)) {
      throw new Error("You do not have permission to disable this admin user.");
    }
    if (input.status === "disabled") {
      appendAdminUserAuditLog({
        action: "access_disabled",
        targetUserId: user.id,
        targetEmail: user.email,
        actorId: actor.adminId,
        actorName: actor.name,
        actorEmail: actor.email,
      });
    }
    user.status = input.status;
  }

  user.updatedAt = now;
  saveAdminUsersState(state);
  return toPublicAdminUser(user);
}

export function disableAdminUserLocal(
  userId: string,
  actor: AdminUserActor,
): ReturnType<typeof toPublicAdminUser> {
  return updateAdminUserLocal(userId, { status: "disabled" }, actor);
}

export function syncAdminUsersFromServer(users: ReturnType<typeof toPublicAdminUser>[]): void {
  if (!isBrowser()) {
    return;
  }

  const state = getAdminUsersState();
  const merged = users.map((publicUser) => {
    const existing = state.users.find((user) => user.id === publicUser.id);
    return {
      ...publicUser,
      passwordHash: existing?.passwordHash ?? null,
      inviteToken: existing?.inviteToken ?? null,
    } satisfies AdminUser;
  });

  saveAdminUsersState({ users: merged });
}
