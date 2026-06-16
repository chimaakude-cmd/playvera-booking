import { NextResponse } from "next/server";
import {
  AUTH_ROLE_COOKIE,
  AUTH_ROLE_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/auth/constants";
import {
  buildTestAdminUser,
  getTestAdminSessionCookieOptions,
  getTestAdminSessionCookieValue,
  TEST_ADMIN_SESSION_COOKIE,
  validateTestAdminCredentials,
} from "@/lib/auth/test-admin-session";

// TODO: Replace with production auth before launch.
type TestLoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  let body: TestLoginBody;

  try {
    body = (await request.json()) as TestLoginBody;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const email = body.email ?? "";
  const password = body.password ?? "";

  if (!validateTestAdminCredentials(email, password)) {
    return NextResponse.json({ ok: false, error: "Access denied" }, { status: 401 });
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
