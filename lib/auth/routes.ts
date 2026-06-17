import type { UserRole } from "./types";

export const AUTH_EXEMPT_PATHS: Record<UserRole, string[]> = {
  parent: ["/parent/login", "/parent/signup"],
  club: ["/club/login", "/club/onboarding"],
  admin: [
    "/admin/login",
    "/admin/signup",
    "/admin/auth/callback",
    "/admin/auth/complete",
    "/admin/accept-invite",
    "/admin/repair-access",
  ],
  organisation: [
    "/organisation/login",
    "/organisation/signup",
    "/organisation/onboarding",
  ],
};

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case "parent":
      return "/parent/dashboard";
    case "club":
      return "/club/dashboard";
    case "admin":
      return "/admin/dashboard";
    case "organisation":
      return "/organisation/dashboard";
  }
}

export function getLoginPath(role: UserRole): string {
  switch (role) {
    case "parent":
      return "/parent/login";
    case "club":
      return "/club/login";
    case "admin":
      return "/admin/login";
    case "organisation":
      return "/organisation/login";
  }
}

export function getPortalPrefix(role: UserRole): string {
  switch (role) {
    case "parent":
      return "/parent";
    case "club":
      return "/club";
    case "admin":
      return "/admin";
    case "organisation":
      return "/organisation";
  }
}

export function isAuthExemptPath(pathname: string, role: UserRole): boolean {
  return AUTH_EXEMPT_PATHS[role].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function getRequiredRoleForPath(pathname: string): UserRole | null {
  if (pathname.startsWith("/parent")) {
    return "parent";
  }
  if (pathname.startsWith("/club")) {
    return "club";
  }
  if (pathname.startsWith("/admin")) {
    return "admin";
  }
  if (pathname.startsWith("/organisation")) {
    return "organisation";
  }
  return null;
}
