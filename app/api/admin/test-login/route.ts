import { NextResponse } from "next/server";
import {
  AUTH_ROLE_COOKIE,
  AUTH_ROLE_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/auth/constants";
import { DEFAULT_ADMIN_TEST_EMAIL } from "@/lib/auth/admin-test-credentials";
import {
  buildTestAdminUser,
  getTestAdminSessionCookieOptions,
  getTestAdminSessionCookieValue,
  TEST_ADMIN_SESSION_COOKIE,
} from "@/lib/auth/test-admin-session";

// TODO: Replace with production auth (password, MFA, credential checks) before launch.
type TestLoginBody = {
  email?: string;
};

export async function POST(request: Request) {
  let email = DEFAULT_ADMIN_TEST_EMAIL;

  try {
    const body = (await request.json()) as TestLoginBody;
    if (body.email?.trim()) {
      email = body.email.trim();
    }
  } catch {
    // TODO: Require valid login payload before launch.
  }

  const user = buildTestAdminUser(email);
  const response = NextResponse.json({ ok: true, user });
  const cookieOptions = getTestAdminSessionCookieOptions();
  const isProduction = process.env.NODE_ENV === "production";

  response.cookies.set(
    TEST_ADMIN_SESSION_COOKIE,
    getTestAdminSessionCookieValue(),
    cookieOptions,
  );
  response.cookies.set(AUTH_ROLE_COOKIE, "admin", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_ROLE_COOKIE_MAX_AGE_SECONDS,
  });

  return response;
}
