import { isDevelopmentEnvironment } from "@/lib/admin-users/production-gates";
import { readAuthSession } from "@/lib/auth/session";
import type { AuthUser } from "@/lib/auth/types";

export type ClubAccountType = "standard" | "demo";

/** Routes where example club business data is allowed. */
export const CLUB_DEMO_ROUTES = [
  "/club/demo",
  "/club/demo-register",
  "/club/demo-customers",
  "/club/demo-discounts",
] as const;

export function isClubDemoRoute(pathname?: string): boolean {
  const path =
    pathname ??
    (typeof window !== "undefined" ? window.location.pathname : "");

  if (!path) {
    return false;
  }

  return CLUB_DEMO_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );
}

export function getClubAccountType(user?: AuthUser | null): ClubAccountType {
  const session = user ?? readAuthSession();
  return session?.accountType === "demo" ? "demo" : "standard";
}

/** Example business data (seed parents, demo registers, etc.) */
export function shouldShowClubDemoData(pathname?: string): boolean {
  if (isClubDemoRoute(pathname)) {
    return true;
  }

  return (
    isDevelopmentEnvironment() && getClubAccountType() === "demo"
  );
}

export function isDemoClubRecordId(id: string): boolean {
  const normalized = id.trim().toLowerCase();
  return (
    normalized.startsWith("seed-") ||
    normalized.startsWith("booking-demo-") ||
    normalized.startsWith("demo-") ||
    normalized.includes("-demo-") ||
    normalized === "demo-block-summer-camp" ||
    normalized === "demo-session"
  );
}

export function filterProductionClubRecords<T extends { id: string }>(
  records: T[],
  pathname?: string,
): T[] {
  if (shouldShowClubDemoData(pathname)) {
    return records;
  }

  return records.filter((record) => !isDemoClubRecordId(record.id));
}
