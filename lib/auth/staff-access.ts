import type { AdminRole } from "@/lib/admin/types";
import { findTestAccount } from "./accounts";
import { writeAuthSession } from "./session";
import type { AuthUser, TestAccount } from "./types";

function accountToUser(account: TestAccount): AuthUser {
  return {
    id: `${account.role}_demo_001`,
    email: account.email,
    name: account.name,
    role: account.role,
    accountType: account.accountType ?? "standard",
    clubRole: account.clubRole,
    adminRole: account.adminRole,
    organisationRole: account.organisationRole,
  };
}

export const STAFF_ACCESS_ATTEMPTS_KEY = "activora-staff-access-attempts";

const LOCKOUT_ENABLED = process.env.ADMIN_LOCKOUT_ENABLED === "true";
const MAX_FAILURES = LOCKOUT_ENABLED ? 5 : 999;
const LOCKOUT_MS = LOCKOUT_ENABLED ? 15 * 60 * 1000 : 0;

type AttemptState = {
  failures: number;
  lockedUntil: string | null;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readAttempts(): AttemptState {
  if (!isBrowser()) {
    return { failures: 0, lockedUntil: null };
  }
  try {
    const raw = localStorage.getItem(STAFF_ACCESS_ATTEMPTS_KEY);
    if (!raw) {
      return { failures: 0, lockedUntil: null };
    }
    return JSON.parse(raw) as AttemptState;
  } catch {
    return { failures: 0, lockedUntil: null };
  }
}

function writeAttempts(state: AttemptState): void {
  if (!isBrowser()) {
    return;
  }
  localStorage.setItem(STAFF_ACCESS_ATTEMPTS_KEY, JSON.stringify(state));
}

export function getStaffAccessLockoutRemainingMs(): number {
  const state = readAttempts();
  if (!state.lockedUntil) {
    return 0;
  }
  const remaining = new Date(state.lockedUntil).getTime() - Date.now();
  return remaining > 0 ? remaining : 0;
}

export function isStaffAccessLocked(): boolean {
  return getStaffAccessLockoutRemainingMs() > 0;
}

function recordFailure(): void {
  const state = readAttempts();
  const failures = state.failures + 1;
  if (failures >= MAX_FAILURES) {
    writeAttempts({
      failures,
      lockedUntil: new Date(Date.now() + LOCKOUT_MS).toISOString(),
    });
    return;
  }
  writeAttempts({ failures, lockedUntil: null });
}

export function recordStaffAccessFailure(): void {
  recordFailure();
}

export type StaffAccessLoginFailureCode =
  | "account_not_found"
  | "password_incorrect"
  | "password_mismatch_auth"
  | "access_not_active"
  | "auth_not_configured";

/**
 * Updates client-side lockout state from /api/admin/auth/login responses.
 * Only wrong-password attempts count toward lockout.
 */
export function handleStaffAccessLoginFailure(
  status: number,
  code?: StaffAccessLoginFailureCode,
): void {
  if (
    code === "password_incorrect" ||
    code === "password_mismatch_auth" ||
    (status === 401 && !code)
  ) {
    recordStaffAccessFailure();
    return;
  }

  if (code === "account_not_found" || code === "access_not_active") {
    clearStaffAccessAttempts();
  }
}

export function clearStaffAccessAttempts(): void {
  if (!isBrowser()) {
    return;
  }
  localStorage.removeItem(STAFF_ACCESS_ATTEMPTS_KEY);
}

export function getStaffDashboardPath(adminRole: AdminRole): string {
  switch (adminRole) {
    case "finance_admin":
      return "/admin/finance";
    case "support_admin":
      return "/admin/messages";
    case "content_admin":
      return "/admin/releases";
    case "owner":
    case "super_admin":
    default:
      return "/admin/dashboard";
  }
}

export type StaffLoginResult =
  | { ok: true; user: AuthUser; redirectTo: string }
  | { ok: false; error: "locked" | "invalid" };

/**
 * Local test-account login for development demos.
 * Production staff sign-in uses POST /api/admin/auth/login (Supabase Auth).
 */
export function staffAccessLogin(
  email: string,
  password: string,
): StaffLoginResult {
  if (isStaffAccessLocked()) {
    return { ok: false, error: "locked" };
  }

  const account = findTestAccount(email, password);
  if (!account || account.role !== "admin") {
    recordFailure();
    return { ok: false, error: "invalid" };
  }

  const user = accountToUser(account);
  writeAuthSession(user);
  clearStaffAccessAttempts();
  const adminRole = user.adminRole ?? "super_admin";
  return {
    ok: true,
    user,
    redirectTo: getStaffDashboardPath(adminRole),
  };
}
