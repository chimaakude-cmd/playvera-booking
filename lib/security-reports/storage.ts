import type { CreateSecurityReportInput, SecurityReport } from "./types";

export const SECURITY_REPORTS_KEY = "activora-security-reports";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (!isBrowser()) {
    return;
  }
  localStorage.setItem(key, JSON.stringify(value));
}

export function getSecurityReports(): SecurityReport[] {
  const reports = readJson<SecurityReport[]>(SECURITY_REPORTS_KEY, []);
  return [...reports].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function createSecurityReport(
  input: CreateSecurityReportInput,
): SecurityReport {
  const reports = readJson<SecurityReport[]>(SECURITY_REPORTS_KEY, []);
  const report: SecurityReport = {
    id: createId("sec"),
    name: input.name.trim(),
    email: input.email.trim(),
    issue: input.issue.trim(),
    attachmentName: input.attachmentName?.trim() || null,
    createdAt: nowIso(),
  };
  writeJson(SECURITY_REPORTS_KEY, [report, ...reports]);
  return report;
}
