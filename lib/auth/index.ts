"use client";

import { findTestAccount, TEST_ACCOUNTS } from "./accounts";
import { getDashboardPath } from "./routes";
import {
  clearAuthSession,
  readAuthSession,
  writeAuthSession,
} from "./session";
import type { AuthUser, TestAccount, UserRole } from "./types";

export * from "./types";
export * from "./accounts";
export * from "./routes";
export * from "./session";

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

export function login(email: string, password: string): AuthUser | null {
  const account = findTestAccount(email, password);
  if (!account) {
    return null;
  }

  const user = accountToUser(account);
  writeAuthSession(user);
  return user;
}

export function loginTestAccount(kind: keyof typeof TEST_ACCOUNTS): AuthUser {
  const user = accountToUser(TEST_ACCOUNTS[kind]);
  writeAuthSession(user);
  return user;
}

export function logout(): void {
  clearAuthSession();
}

export function getCurrentUser(): AuthUser | null {
  return readAuthSession();
}

export function requireRole(role: UserRole): AuthUser | null {
  const user = getCurrentUser();
  if (!user || user.role !== role) {
    return null;
  }
  return user;
}

export function getRedirectAfterLogin(user: AuthUser): string {
  return getDashboardPath(user.role);
}
