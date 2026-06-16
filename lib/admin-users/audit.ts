import { SEED_ADMIN_USER_AUDIT } from "./defaults";
import { ADMIN_USERS_AUDIT_KEY } from "./types";
import type { AdminUserAuditAction, AdminUserAuditEntry } from "./types";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function createId(): string {
  return `admin_audit_${crypto.randomUUID().slice(0, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function readAuditLog(): AdminUserAuditEntry[] {
  if (!isBrowser()) {
    return SEED_ADMIN_USER_AUDIT;
  }

  try {
    const raw = localStorage.getItem(ADMIN_USERS_AUDIT_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw) as AdminUserAuditEntry[];
  } catch {
    return [];
  }
}

function writeAuditLog(entries: AdminUserAuditEntry[]): void {
  if (!isBrowser()) {
    return;
  }
  localStorage.setItem(ADMIN_USERS_AUDIT_KEY, JSON.stringify(entries));
}

export function getAdminUserAuditLog(): AdminUserAuditEntry[] {
  return [...readAuditLog()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getAdminUserAuditLogForUser(userId: string): AdminUserAuditEntry[] {
  return getAdminUserAuditLog().filter((entry) => entry.targetUserId === userId);
}

export function appendAdminUserAuditLog(input: {
  action: AdminUserAuditAction;
  targetUserId: string;
  targetEmail: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  details?: string;
}): AdminUserAuditEntry {
  const entry: AdminUserAuditEntry = {
    id: createId(),
    action: input.action,
    targetUserId: input.targetUserId,
    targetEmail: input.targetEmail,
    actorId: input.actorId,
    actorName: input.actorName,
    actorEmail: input.actorEmail,
    details: input.details,
    createdAt: nowIso(),
  };
  writeAuditLog([entry, ...readAuditLog()]);
  return entry;
}
