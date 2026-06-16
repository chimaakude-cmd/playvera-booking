import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { SEED_ADMIN_USER_AUDIT, SEED_ADMIN_USERS_STATE } from "./defaults";
import { generateInviteToken } from "./invite-link";
import { hashAdminPassword } from "./password";
import {
  canAssignAdminRole,
  canDisableAdminUser,
  canEditAdminUser,
} from "./permissions";
import type {
  AdminUser,
  AdminUserAuditEntry,
  AdminUsersState,
  InviteAdminUserInput,
  UpdateAdminUserInput,
} from "./types";
import { toPublicAdminUser } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const USERS_FILE = path.join(DATA_DIR, "admin-users.json");
const AUDIT_FILE = path.join(DATA_DIR, "admin-users-audit.json");

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

async function ensureDataDir(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile<T>(filePath: string, value: T): Promise<void> {
  await ensureDataDir();
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function loadState(): Promise<AdminUsersState> {
  const stored = await readJsonFile<AdminUsersState>(USERS_FILE, {
    users: [],
  });
  if (stored.users.length === 0) {
    await writeJsonFile(USERS_FILE, SEED_ADMIN_USERS_STATE);
    return SEED_ADMIN_USERS_STATE;
  }
  return stored;
}

async function saveState(state: AdminUsersState): Promise<void> {
  await writeJsonFile(USERS_FILE, state);
}

export async function getServerAdminUsers(): Promise<AdminUser[]> {
  const state = await loadState();
  return [...state.users].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function getServerAdminUserById(id: string): Promise<AdminUser | null> {
  const users = await getServerAdminUsers();
  return users.find((user) => user.id === id) ?? null;
}

export async function getServerAdminUserByEmail(
  email: string,
): Promise<AdminUser | null> {
  const normalized = email.trim().toLowerCase();
  const users = await getServerAdminUsers();
  return users.find((user) => user.email.toLowerCase() === normalized) ?? null;
}

export async function getServerAuditLog(): Promise<AdminUserAuditEntry[]> {
  const stored = await readJsonFile<AdminUserAuditEntry[]>(AUDIT_FILE, []);
  if (stored.length === 0) {
    await writeJsonFile(AUDIT_FILE, SEED_ADMIN_USER_AUDIT);
    return SEED_ADMIN_USER_AUDIT;
  }
  return stored;
}

export async function appendServerAuditEntry(
  entry: AdminUserAuditEntry,
  existing?: AdminUserAuditEntry[],
): Promise<void> {
  const current = existing ?? (await getServerAuditLog());
  await writeJsonFile(AUDIT_FILE, [entry, ...current]);
}

export type AdminUserActor = {
  adminId: string;
  email: string;
  name: string;
  role: AdminUser["role"];
};

export async function createServerAdminInvite(
  input: InviteAdminUserInput,
  actor: AdminUserActor,
): Promise<{ user: ReturnType<typeof toPublicAdminUser>; inviteLink: string }> {
  if (!canAssignAdminRole(actor.role, input.role)) {
    throw new Error("You do not have permission to assign this role.");
  }

  const state = await loadState();
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
  await saveState(state);

  const { buildAdminInviteLink } = await import("./invite-link");
  const inviteLink = buildAdminInviteLink(inviteToken);

  await appendServerAuditEntry({
    id: createId("admin_audit"),
    action: "invite_sent",
    targetUserId: user.id,
    targetEmail: user.email,
    actorId: actor.adminId,
    actorName: actor.name,
    actorEmail: actor.email,
    details: `Invited as ${input.role}`,
    createdAt: now,
  });

  return { user: toPublicAdminUser(user), inviteLink };
}

export async function resendServerAdminInvite(
  userId: string,
  actor: AdminUserActor,
): Promise<{ user: ReturnType<typeof toPublicAdminUser>; inviteLink: string }> {
  const state = await loadState();
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
  await saveState(state);

  const { buildAdminInviteLink } = await import("./invite-link");
  const inviteLink = buildAdminInviteLink(user.inviteToken);

  await appendServerAuditEntry({
    id: createId("admin_audit"),
    action: "invite_resent",
    targetUserId: user.id,
    targetEmail: user.email,
    actorId: actor.adminId,
    actorName: actor.name,
    actorEmail: actor.email,
    createdAt: now,
  });

  return { user: toPublicAdminUser(user), inviteLink };
}

export async function updateServerAdminUser(
  userId: string,
  input: UpdateAdminUserInput,
  actor: AdminUserActor,
): Promise<ReturnType<typeof toPublicAdminUser>> {
  const state = await loadState();
  const user = state.users.find((item) => item.id === userId);
  if (!user) {
    throw new Error("Admin user not found.");
  }
  if (!canEditAdminUser(actor.role, user)) {
    throw new Error("You do not have permission to edit this admin user.");
  }

  const now = nowIso();
  const auditEntries: AdminUserAuditEntry[] = [];

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
    auditEntries.push({
      id: createId("admin_audit"),
      action: "email_changed",
      targetUserId: user.id,
      targetEmail: normalized,
      actorId: actor.adminId,
      actorName: actor.name,
      actorEmail: actor.email,
      details: `Changed from ${user.email}`,
      createdAt: now,
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
    auditEntries.push({
      id: createId("admin_audit"),
      action: "role_changed",
      targetUserId: user.id,
      targetEmail: user.email,
      actorId: actor.adminId,
      actorName: actor.name,
      actorEmail: actor.email,
      details: `Changed from ${user.role} to ${input.role}`,
      createdAt: now,
    });
    user.role = input.role;
  }

  if (typeof input.emailVerified === "boolean" && input.emailVerified !== user.emailVerified) {
    user.emailVerified = input.emailVerified;
    if (input.emailVerified) {
      auditEntries.push({
        id: createId("admin_audit"),
        action: "email_verified",
        targetUserId: user.id,
        targetEmail: user.email,
        actorId: actor.adminId,
        actorName: actor.name,
        actorEmail: actor.email,
        createdAt: now,
      });
    }
  }

  if (input.password?.trim()) {
    user.passwordHash = await hashAdminPassword(input.password.trim());
    auditEntries.push({
      id: createId("admin_audit"),
      action: "password_changed",
      targetUserId: user.id,
      targetEmail: user.email,
      actorId: actor.adminId,
      actorName: actor.name,
      actorEmail: actor.email,
      createdAt: now,
    });
    if (user.status === "invited") {
      user.status = "active";
      user.inviteToken = null;
    }
  }

  if (input.status && input.status !== user.status) {
    if (input.status === "disabled" && !canDisableAdminUser(actor.role, user)) {
      throw new Error("You do not have permission to disable this admin user.");
    }
    if (input.status === "disabled") {
      auditEntries.push({
        id: createId("admin_audit"),
        action: "access_disabled",
        targetUserId: user.id,
        targetEmail: user.email,
        actorId: actor.adminId,
        actorName: actor.name,
        actorEmail: actor.email,
        createdAt: now,
      });
    }
    user.status = input.status;
  }

  user.updatedAt = now;
  await saveState(state);

  for (const entry of auditEntries) {
    await appendServerAuditEntry(entry);
  }

  return toPublicAdminUser(user);
}

export async function disableServerAdminUser(
  userId: string,
  actor: AdminUserActor,
): Promise<ReturnType<typeof toPublicAdminUser>> {
  return updateServerAdminUser(userId, { status: "disabled" }, actor);
}

export async function getServerAdminUsersPublic(): Promise<
  ReturnType<typeof toPublicAdminUser>[]
> {
  const users = await getServerAdminUsers();
  return users.map(toPublicAdminUser);
}
