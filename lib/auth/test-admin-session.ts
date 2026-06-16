import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import type { AuthUser } from "./types";

export const TEST_ADMIN_SESSION_COOKIE = "activora-test-admin-session";
export const TEST_ADMIN_LOGIN_PATH = "/admin-login";
export const TEST_ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

const TEST_ADMIN_SESSION_VALUE = "authenticated";

// TODO: Replace with production auth (OAuth, MFA, password, 2FA) before launch.
export function validateTestAdminCredentials(_email: string): boolean {
  // TODO: Restore env/credential validation before launch.
  return true;
}

export function buildTestAdminUser(email: string): AuthUser {
  return {
    id: "test_admin_001",
    email: email.trim().toLowerCase(),
    name: "Test Admin",
    role: "admin",
    adminRole: "super_admin",
  };
}

export function getTestAdminSessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: TEST_ADMIN_SESSION_MAX_AGE_SECONDS,
  };
}

export function hasTestAdminSessionFromRequest(request: NextRequest): boolean {
  return (
    request.cookies.get(TEST_ADMIN_SESSION_COOKIE)?.value ===
    TEST_ADMIN_SESSION_VALUE
  );
}

export async function hasTestAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return (
    cookieStore.get(TEST_ADMIN_SESSION_COOKIE)?.value ===
    TEST_ADMIN_SESSION_VALUE
  );
}

export function getTestAdminSessionCookieValue(): string {
  return TEST_ADMIN_SESSION_VALUE;
}
