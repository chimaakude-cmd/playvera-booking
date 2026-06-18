import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_EXEMPT_PATHS, getDashboardPath, getLoginPath } from "@/lib/auth/routes";
import { AUTH_ROLE_COOKIE } from "@/lib/auth/constants";
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

function buildLoginReturnPath(request: NextRequest, pathname: string): string {
  const search = request.nextUrl.search;
  return search ? `${pathname}${search}` : pathname;
}

function applyClubLoginRedirectParams(
  loginUrl: URL,
  request: NextRequest,
  returnPath: string,
): void {
  loginUrl.searchParams.set("next", returnPath);

  if (request.nextUrl.searchParams.get("setup") === "1") {
    loginUrl.searchParams.set("setup", "1");
  }

  if (
    request.nextUrl.searchParams.get("from") === "onboarding" ||
    request.nextUrl.pathname.startsWith("/club/onboarding")
  ) {
    loginUrl.searchParams.set("from", "onboarding");
  }
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

  const currentRole = getRoleFromCookie(request);

  if (!currentRole) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = getLoginPath(role);
    loginUrl.search = "";
    const returnPath = buildLoginReturnPath(request, pathname);
    if (role === "club") {
      applyClubLoginRedirectParams(loginUrl, request, returnPath);
    } else {
      loginUrl.searchParams.set("next", returnPath);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (currentRole !== role) {
    // Club portal must never bounce visitors to admin/parent dashboards.
    if (role === "club") {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = getLoginPath("club");
      loginUrl.search = "";
      const returnPath = buildLoginReturnPath(request, pathname);
      applyClubLoginRedirectParams(loginUrl, request, returnPath);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.set(AUTH_ROLE_COOKIE, "", { path: "/", maxAge: 0 });
      return response;
    }

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
