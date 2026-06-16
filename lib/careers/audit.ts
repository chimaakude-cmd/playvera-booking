import { CAREERS_AUDIT_LOG_KEY, SEED_CAREER_AUDIT_LOG } from "./defaults";
import type { CareerAuditAction, CareerAuditLogEntry } from "./types";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function createId(): string {
  return `audit_${crypto.randomUUID().slice(0, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function readAuditLog(): CareerAuditLogEntry[] {
  if (!isBrowser()) {
    return SEED_CAREER_AUDIT_LOG;
  }
  try {
    const raw = localStorage.getItem(CAREERS_AUDIT_LOG_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw) as CareerAuditLogEntry[];
  } catch {
    return [];
  }
}

function writeAuditLog(entries: CareerAuditLogEntry[]): void {
  if (!isBrowser()) {
    return;
  }
  localStorage.setItem(CAREERS_AUDIT_LOG_KEY, JSON.stringify(entries));
}

export function getCareerAuditLog(): CareerAuditLogEntry[] {
  return [...readAuditLog()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getCareerAuditLogForJob(jobId: string): CareerAuditLogEntry[] {
  return getCareerAuditLog().filter((entry) => entry.jobId === jobId);
}

export function appendCareerAuditLog(input: {
  action: CareerAuditAction;
  jobId: string;
  jobTitle: string;
  actorId: string;
  actorName: string;
  details?: string;
}): CareerAuditLogEntry {
  const entry: CareerAuditLogEntry = {
    id: createId(),
    action: input.action,
    jobId: input.jobId,
    jobTitle: input.jobTitle,
    actorId: input.actorId,
    actorName: input.actorName,
    details: input.details,
    createdAt: nowIso(),
  };
  writeAuditLog([entry, ...readAuditLog()]);
  return entry;
}
