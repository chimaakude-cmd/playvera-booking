import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import type { AuthUser } from "./types";

export const TEST_ADMIN_SESSION_COOKIE = "activora-test-admin-session";
export const TEST_ADMIN_LOGIN_PATH = "/admin-login";
export const TEST_ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

const TEST_ADMIN_SESSION_VALUE = "authenticated";

export function validateTestAdminCredentials(
  email: string,
  password: string,
  twoFactorCode: string,
): boolean {
  const expectedEmail = process.env.ADMIN_TEST_EMAIL?.trim();
  const expectedPassword = process.env.ADMIN_TEST_PASSWORD;
  const expectedTwoFactorCode = process.env.ADMIN_TEST_2FA_CODE?.trim();

  if (!expectedEmail || !expectedPassword || !expectedTwoFactorCode) {
    return false;
  }

  return (
    email.trim().toLowerCase() === expectedEmail.toLowerCase() &&
    password === expectedPassword &&
    twoFactorCode.trim() === expectedTwoFactorCode
  );
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
