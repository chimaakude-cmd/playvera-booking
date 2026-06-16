"use client";

import {
  AUTH_ROLE_COOKIE,
  AUTH_ROLE_COOKIE_MAX_AGE_SECONDS,
  AUTH_SESSION_KEY,
} from "./constants";
import type { AuthUser } from "./types";

export { AUTH_ROLE_COOKIE, AUTH_SESSION_KEY } from "./constants";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function readAuthSession(): AuthUser | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function writeAuthSession(user: AuthUser): void {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
  document.cookie = `${AUTH_ROLE_COOKIE}=${user.role}; path=/; max-age=${AUTH_ROLE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function clearAuthSession(): void {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(AUTH_SESSION_KEY);
  document.cookie = `${AUTH_ROLE_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}
