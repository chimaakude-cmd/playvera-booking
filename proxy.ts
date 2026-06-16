import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_EXEMPT_PATHS, getDashboardPath, getLoginPath } from "@/lib/auth/routes";
import { AUTH_ROLE_COOKIE } from "@/lib/auth/constants";
import {
  hasTestAdminSessionFromRequest,
  TEST_ADMIN_LOGIN_PATH,
} from "@/lib/auth/test-admin-session";
import type { UserRole } from "@/lib/auth/types";

function getRoleFromCookie(request: NextRequest): UserRole | null {
  const value = request.cookies.get(AUTH_ROLE_COOKIE)?.value;
  if (
    value === "parent" ||
    value === "club" ||
    value === "admin" ||
    value === "organisation"
  ) {
    return value;
  }
  return null;
}

function isExempt(pathname: string, role: UserRole): boolean {
  return AUTH_EXEMPT_PATHS[role].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function hasAdminPortalAccess(request: NextRequest): boolean {
  // TODO: Replace test-admin session gate with production auth before launch.
  if (getRoleFromCookie(request) === "admin") {
    return true;
  }

  return hasTestAdminSessionFromRequest(request);
}

function protectPortal(
  request: NextRequest,
  role: UserRole,
  prefix: string,
): NextResponse | null {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith(prefix)) {
    return null;
  }

  if (isExempt(pathname, role)) {
    return null;
  }

  if (role === "admin") {
    if (!hasAdminPortalAccess(request)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = TEST_ADMIN_LOGIN_PATH;
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return null;
  }

  const currentRole = getRoleFromCookie(request);

  if (!currentRole) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = getLoginPath(role);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (currentRole !== role) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = getDashboardPath(currentRole);
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  return null;
}

export function proxy(request: NextRequest) {
  const parentResponse = protectPortal(request, "parent", "/parent");
  if (parentResponse) {
    return parentResponse;
  }

  const clubResponse = protectPortal(request, "club", "/club");
  if (clubResponse) {
    return clubResponse;
  }

  const adminResponse = protectPortal(request, "admin", "/admin");
  if (adminResponse) {
    return adminResponse;
  }

  const organisationResponse = protectPortal(
    request,
    "organisation",
    "/organisation",
  );
  if (organisationResponse) {
    return organisationResponse;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/parent",
    "/parent/:path*",
    "/club",
    "/club/:path*",
    "/admin",
    "/admin/:path*",
    "/organisation",
    "/organisation/:path*",
  ],
};
