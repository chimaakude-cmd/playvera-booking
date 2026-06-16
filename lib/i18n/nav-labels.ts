import type { ClubNavSection } from "@/lib/club-team";

type TranslateFn = (key: string) => string;

const CLUB_NAV_KEYS: Partial<Record<ClubNavSection, string>> = {
  dashboard: "club.dashboard",
  inbox: "club.inbox",
  activities: "club.activities",
  bookings: "club.bookings",
  registers: "club.registers",
  customers: "club.customers",
  finance: "club.finance",
  settings: "club.settings",
  club_profile: "club.clubProfile",
  team_access: "club.teamAccess",
};

export function translateClubNavLabel(
  section: ClubNavSection,
  fallback: string,
  t: TranslateFn,
): string {
  const key = CLUB_NAV_KEYS[section];
  if (!key) {
    return fallback;
  }
  const translated = t(key);
  return translated === key ? fallback : translated;
}

const PARENT_NAV_KEYS: Record<string, string> = {
  "/parent/dashboard": "parent.dashboard",
  "/parent/children": "parent.children",
  "/parent/bookings": "parent.bookings",
  "/parent/waitlist": "parent.waitlist",
  "/parent/profile": "parent.profile",
};

export function translateParentNavLabel(
  href: string,
  fallback: string,
  t: TranslateFn,
): string {
  const key = PARENT_NAV_KEYS[href];
  if (!key) {
    return fallback;
  }
  const translated = t(key);
  return translated === key ? fallback : translated;
}

const ORG_NAV_KEYS: Record<string, string> = {
  "/organisation/dashboard": "org.dashboard",
  "/organisation/clubs": "org.clubs",
  "/organisation/bookings": "org.bookings",
  "/organisation/finance": "org.finance",
  "/organisation/settings": "org.settings",
};

export function translateOrgNavLabel(
  href: string,
  fallback: string,
  t: TranslateFn,
): string {
  const key = ORG_NAV_KEYS[href];
  if (!key) {
    return fallback;
  }
  const translated = t(key);
  return translated === key ? fallback : translated;
}

export function translateFooterColumnTitle(
  columnId: string,
  fallback: string,
  t: TranslateFn,
): string {
  const key = `columns.${columnId}`;
  const translated = t(key);
  return translated === key ? fallback : translated;
}
