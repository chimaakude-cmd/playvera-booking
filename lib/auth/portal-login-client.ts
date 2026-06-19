"use client";

import { login, logout, writeAuthSession, type AuthUser } from "@/lib/auth";
import {
  isValidLoginEmail,
  loginErrorMessage,
  type LoginErrorKind,
} from "@/lib/auth/login-messages";
import type { PortalLoginRole } from "@/lib/auth/portal-login-server";
import { isSupabaseConfigured } from "@/lib/supabase";

export type PortalLoginClientResult =
  | { ok: true; user: AuthUser; redirectTo: string }
  | { ok: false; kind: LoginErrorKind };

export async function submitPortalLogin(
  portal: PortalLoginRole,
  email: string,
  password: string,
): Promise<PortalLoginClientResult> {
  const trimmedEmail = email.trim();

  if (!trimmedEmail || !isValidLoginEmail(trimmedEmail)) {
    return { ok: false, kind: "invalidEmail" };
  }

  if (!password) {
    return { ok: false, kind: "wrongPassword" };
  }

  if (!isSupabaseConfigured()) {
    const user = login(trimmedEmail, password);
    if (!user) {
      return { ok: false, kind: "noAccount" };
    }

    if (user.role !== portal) {
      logout();
      return { ok: false, kind: "wrongPortal" };
    }

    const redirectTo =
      portal === "club"
        ? "/club/dashboard"
        : portal === "parent"
          ? "/parent/dashboard"
          : "/organisation/dashboard";

    return { ok: true, user, redirectTo };
  }

  const response = await fetch(`/api/${portal}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: trimmedEmail, password }),
  });

  const payload = (await response.json()) as {
    ok?: boolean;
    user?: AuthUser;
    redirectTo?: string;
    kind?: LoginErrorKind;
    error?: string;
  };

  if (!response.ok || !payload.ok || !payload.user) {
    return {
      ok: false,
      kind: payload.kind ?? "generic",
    };
  }

  writeAuthSession(payload.user);

  return {
    ok: true,
    user: payload.user,
    redirectTo:
      payload.redirectTo ??
      (portal === "club"
        ? "/club/dashboard"
        : portal === "parent"
          ? "/parent/dashboard"
          : "/organisation/dashboard"),
  };
}

export function portalLoginErrorToMessage(kind: LoginErrorKind): string {
  return loginErrorMessage(kind);
}
