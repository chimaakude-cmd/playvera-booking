import { createDefaultBookingQuestions } from "@/lib/booking-questions";
import { fetchSetupProgressFromApi } from "@/lib/club-setup/client";
import { computeSetupProgressFromSessions } from "@/lib/club-setup/compute";
import type { SetupProgressResult } from "@/lib/club-setup/types";
import { CLUB_DEFAULT_BOOKING_QUESTIONS_KEY } from "@/lib/club-onboarding/types";
import { getClubProfile } from "@/lib/club-profile";
import { DEFAULT_CLUB_LOCATIONS } from "@/lib/club-profile/defaults";
import {
  formatClubAddress,
  getMainClubLocation,
  type ClubProfile,
} from "@/lib/club-profile/types";
import { getClubTeamState } from "@/lib/club-team/storage";
import { getVatSettings } from "@/lib/club-finance/vat-settings";
import { shouldShowVatSetupTask } from "@/lib/club-finance/vat-threshold";
import { isClubPaymentsConfigured } from "@/lib/payment-providers/availability";
import { formatSessionLocation } from "@/lib/session-location";
import { getSessions, type ClubSession } from "@/lib/sessions";

export const NEW_CLUB_ACTIVITY_COUNT_KEY = "activora-club-published-activity-count";
export const FIRST_ACTIVITY_CELEBRATED_KEY = "activora-club-first-activity-celebrated";
export const SETUP_CHECKLIST_COLLAPSED_KEY = "activora-club-setup-checklist-collapsed";

export type NewClubChecklistItemId =
  | "connect_payments"
  | "create_first_activity"
  | "upload_logo_cover"
  | "complete_public_profile"
  | "add_first_venue"
  | "configure_booking_questions"
  | "invite_staff"
  | "add_vat_details"
  | "connect_accounting";

export type NewClubChecklistItem = {
  id: NewClubChecklistItemId;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  completed: boolean;
  optional?: boolean;
  primary?: boolean;
};

export type LaunchReadinessItem = {
  id: "profile" | "payments" | "activities" | "bookings";
  label: string;
  ready: boolean;
};

export type NewClubModeState = {
  isNewClubMode: boolean;
  publishedActivityCount: number;
  activityCount: number;
  primaryStepsRemaining: number;
  estimatedMinutesRemaining: string;
  checklist: NewClubChecklistItem[];
  launchReadiness: LaunchReadinessItem[];
  profile: ClubProfile;
  sessions: ClubSession[];
  profileVisibleToParents: boolean;
  showFirstActivityCelebration: boolean;
  setupProgress: SetupProgressResult;
};

/** Alias used by onboarding flows — same as getClubProfile(). */
export function loadClubProfile(): ClubProfile {
  return getClubProfile();
}

export function isLiveActivity(session: ClubSession): boolean {
  return session.published !== false;
}

export function sessionHasVenue(session: ClubSession): boolean {
  if (session.providerVenueId) {
    return true;
  }

  if (session.venue?.venueName?.trim()) {
    return true;
  }

  if (session.venue?.addressLine1?.trim()) {
    return true;
  }

  const location = session.location?.trim();
  return Boolean(location && location !== "Activora Club");
}

export function getPublishedActivityCount(
  sessions: ClubSession[] = getSessions(),
): number {
  return sessions.filter(isLiveActivity).length;
}

export function isNewClubMode(
  sessions: ClubSession[] = getSessions(),
): boolean {
  return getPublishedActivityCount(sessions) === 0;
}

function hasLogo(profile: ClubProfile): boolean {
  return Boolean(
    profile.logoUrl?.trim() || profile.profileDesign?.logoUrl?.trim(),
  );
}

function hasCover(profile: ClubProfile): boolean {
  return Boolean(
    profile.coverImageUrl?.trim() || profile.profileDesign?.coverUrl?.trim(),
  );
}

function hasAnyVenue(
  profile: ClubProfile,
  sessions: ClubSession[],
  hasProviderVenues = false,
): boolean {
  if (hasProviderVenues) {
    return true;
  }

  if (hasCustomVenue(profile)) {
    return true;
  }

  return sessions.some(
    (session) => isLiveActivity(session) && sessionHasVenue(session),
  );
}

function isPublicProfileComplete(
  profile: ClubProfile,
  sessions: ClubSession[] = [],
  hasProviderVenues = false,
): boolean {
  const description =
    profile.shortDescription?.trim() ||
    profile.longDescription?.trim() ||
    profile.profileDesign?.aboutText?.trim() ||
    "";

  return (
    profile.clubName.trim().length > 0 &&
    hasLogo(profile) &&
    description.length > 0 &&
    hasAnyVenue(profile, sessions, hasProviderVenues)
  );
}

function isDefaultDemoVenue(profile: ClubProfile): boolean {
  if (profile.locations.length !== DEFAULT_CLUB_LOCATIONS.length) {
    return false;
  }

  return profile.locations.every((location, index) => {
    const fallback = DEFAULT_CLUB_LOCATIONS[index];
    if (!fallback) {
      return false;
    }

    return (
      location.id === fallback.id &&
      location.venueName === fallback.venueName &&
      location.addressLine1 === fallback.addressLine1 &&
      location.townCity === fallback.townCity &&
      location.postcode === fallback.postcode
    );
  });
}

function hasCustomVenue(profile: ClubProfile): boolean {
  if (profile.locations.length === 0) {
    return false;
  }

  if (isDefaultDemoVenue(profile)) {
    return false;
  }

  return profile.locations.some(
    (location) =>
      location.venueName.trim().length > 0 &&
      location.addressLine1.trim().length > 0,
  );
}

function hasTeamMembers(): boolean {
  const team = getClubTeamState();
  return team.members.some((member) => !member.isOwner);
}

function hasVatDetails(): boolean {
  const vat = getVatSettings();
  return vat.isVatRegistered && vat.vatRegistrationNumber.trim().length > 0;
}

function hasBookingQuestionsConfigured(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const raw = localStorage.getItem(CLUB_DEFAULT_BOOKING_QUESTIONS_KEY);
    if (!raw) {
      return false;
    }

    const saved = JSON.parse(raw);
    const defaults = createDefaultBookingQuestions();
    return JSON.stringify(saved) !== JSON.stringify(defaults);
  } catch {
    return false;
  }
}

export function isProfileVisibleToParents(
  profile: ClubProfile,
  _sessions: ClubSession[] = [],
  _hasProviderVenues = false,
): boolean {
  return (
    profile.clubName.trim().length > 0 &&
    Boolean(profile.publicSlug?.trim())
  );
}

export function getPrimaryStepsRemaining(checklist: NewClubChecklistItem[]): number {
  return checklist.filter((item) => item.primary && !item.completed).length;
}

export function getEstimatedMinutesRemaining(
  incompleteCount: number,
): string {
  if (incompleteCount >= 3) {
    return "Approx. 10–15 mins remaining";
  }
  if (incompleteCount === 2) {
    return "Approx. 5–10 mins remaining";
  }
  if (incompleteCount === 1) {
    return "Approx. 3–5 mins remaining";
  }
  return "Almost ready to launch";
}

function buildLogoCoverChecklistItem(
  profile: ClubProfile,
): NewClubChecklistItem {
  const logoPresent = hasLogo(profile);
  const coverPresent = hasCover(profile);
  const completed = logoPresent && coverPresent;

  const title = !logoPresent
    ? "Upload logo + cover"
    : !coverPresent
      ? "Add cover image"
      : "Upload logo + cover";

  const description = !logoPresent
    ? "Add your club logo and a cover image for your public profile."
    : !coverPresent
      ? "Add a cover image for your public profile."
      : "Add your club logo and a cover image for your public profile.";

  return {
    id: "upload_logo_cover",
    title,
    description,
    actionLabel: completed ? "Edit" : logoPresent ? "Upload cover" : "Upload",
    href: "/club/settings/profile",
    completed,
  };
}

export function buildNewClubChecklist(
  profile: ClubProfile = getClubProfile(),
  sessions: ClubSession[] = getSessions(),
  hasProviderVenues = false,
  rollingTwelveMonthRevenue = 0,
): NewClubChecklistItem[] {
  const activityCount = sessions.length;
  const paymentsConfigured = isClubPaymentsConfigured();
  const venueComplete = hasAnyVenue(profile, sessions, hasProviderVenues);
  const publicProfileComplete = isPublicProfileComplete(
    profile,
    sessions,
    hasProviderVenues,
  );

  const checklistItems: NewClubChecklistItem[] = [
    {
      id: "connect_payments",
      title: "Connect payment provider",
      description: "Connect Stripe and/or GoCardless to accept payments.",
      actionLabel: paymentsConfigured ? "Connected" : "Connect",
      href: "/club/finance?tab=payment-providers",
      completed: paymentsConfigured,
      primary: true,
    },
    {
      id: "create_first_activity",
      title: "Create first activity",
      description: "Publish your first session so parents can discover and book.",
      actionLabel: activityCount > 0 ? "View" : "Create",
      href: activityCount > 0 ? "/club/activities" : "/club/create-session",
      completed: activityCount > 0,
      primary: true,
    },
    buildLogoCoverChecklistItem(profile),
    {
      id: "complete_public_profile",
      title: "Complete public profile",
      description: "Add logo, description, and club details parents will see.",
      actionLabel: publicProfileComplete ? "Edit" : "Complete",
      href: "/club/settings/profile",
      completed: publicProfileComplete,
      primary: true,
    },
    {
      id: "add_first_venue",
      title: "Add first venue",
      description: "Add where your sessions take place so parents know where to go.",
      actionLabel: venueComplete ? "Manage" : "Add",
      href: "/club/settings",
      completed: venueComplete,
    },
    {
      id: "configure_booking_questions",
      title: "Configure booking questions",
      description: "Customise the questions parents answer when booking.",
      actionLabel: hasBookingQuestionsConfigured() ? "Edit" : "Configure",
      href: "/club/settings/booking-questions",
      completed: hasBookingQuestionsConfigured(),
    },
    {
      id: "invite_staff",
      title: "Invite staff",
      description: "Invite coaches and administrators to help run your club.",
      actionLabel: hasTeamMembers() ? "Manage" : "Invite",
      href: "/club/settings/team",
      completed: hasTeamMembers(),
    },
  ];

  if (shouldShowVatSetupTask(rollingTwelveMonthRevenue)) {
    checklistItems.push({
      id: "add_vat_details",
      title: "Add VAT details",
      description: "Add your VAT registration number if your club is VAT registered.",
      actionLabel: hasVatDetails() ? "Edit" : "Add",
      href: "/club/finance?tab=vat",
      completed: hasVatDetails(),
      optional: true,
    });
  }

  return checklistItems.filter((item) => item.id !== "connect_accounting");
}

export function buildLaunchReadiness(
  checklist: NewClubChecklistItem[],
  publishedActivityCount: number,
): LaunchReadinessItem[] {
  const profileComplete =
    checklist.find((item) => item.id === "complete_public_profile")
      ?.completed ?? false;
  const paymentsConnected =
    checklist.find((item) => item.id === "connect_payments")?.completed ??
    false;
  const activitiesPublished = publishedActivityCount > 0;

  const readyForBookings =
    profileComplete && activitiesPublished;

  return [
    { id: "profile", label: "Profile complete", ready: profileComplete },
    {
      id: "payments",
      label: "Payments connected",
      ready: paymentsConnected,
    },
    {
      id: "activities",
      label: "Activities published",
      ready: activitiesPublished,
    },
    {
      id: "bookings",
      label: "Ready for bookings",
      ready: readyForBookings,
    },
  ];
}

function readStoredActivityCount(): number {
  if (typeof window === "undefined") {
    return 0;
  }

  try {
    const raw = localStorage.getItem(NEW_CLUB_ACTIVITY_COUNT_KEY);
    if (!raw) {
      return 0;
    }
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

export function storePublishedActivityCount(count: number): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(NEW_CLUB_ACTIVITY_COUNT_KEY, String(count));
}

export function hasCelebratedFirstActivity(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return localStorage.getItem(FIRST_ACTIVITY_CELEBRATED_KEY) === "1";
}

export function markFirstActivityCelebrated(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(FIRST_ACTIVITY_CELEBRATED_KEY, "1");
}

export function shouldShowFirstActivityCelebration(
  publishedCount: number,
): boolean {
  if (publishedCount === 0 || hasCelebratedFirstActivity()) {
    return false;
  }

  const previousCount = readStoredActivityCount();
  return previousCount === 0;
}

export function isSetupChecklistCollapsed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return localStorage.getItem(SETUP_CHECKLIST_COLLAPSED_KEY) === "1";
}

export function setSetupChecklistCollapsed(collapsed: boolean): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(SETUP_CHECKLIST_COLLAPSED_KEY, collapsed ? "1" : "0");
}

export function getNewClubModeState(
  sessions: ClubSession[] = getSessions(),
  profile?: ClubProfile,
  hasProviderVenues = false,
  setupProgress?: SetupProgressResult,
  rollingTwelveMonthRevenue = 0,
): NewClubModeState {
  const resolvedProfile = profile ?? loadClubProfile();
  const publishedActivityCount = getPublishedActivityCount(sessions);
  const activityCount = sessions.length;
  const isNewClub = publishedActivityCount === 0;
  const checklist = buildNewClubChecklist(
    resolvedProfile,
    sessions,
    hasProviderVenues,
    rollingTwelveMonthRevenue,
  );
  const primaryStepsRemaining = getPrimaryStepsRemaining(checklist);
  const resolvedSetupProgress =
    setupProgress ??
    computeSetupProgressFromSessions(sessions, resolvedProfile);

  return {
    isNewClubMode: isNewClub,
    publishedActivityCount,
    activityCount,
    primaryStepsRemaining,
    estimatedMinutesRemaining: getEstimatedMinutesRemaining(
      checklist.filter((item) => !item.completed && !item.optional).length,
    ),
    checklist,
    launchReadiness: buildLaunchReadiness(checklist, publishedActivityCount),
    profile: resolvedProfile,
    sessions,
    profileVisibleToParents: isProfileVisibleToParents(
      resolvedProfile,
      sessions,
      hasProviderVenues,
    ),
    showFirstActivityCelebration:
      shouldShowFirstActivityCelebration(publishedActivityCount),
    setupProgress: resolvedSetupProgress,
  };
}

export function getProfileLocationLabel(
  profile: ClubProfile,
  sessions: ClubSession[] = [],
): string {
  const main = getMainClubLocation(profile);
  if (main && !isDefaultDemoVenue(profile)) {
    return formatClubAddress(main) || main.venueName;
  }

  const sessionWithVenue = sessions.find(
    (session) => isLiveActivity(session) && sessionHasVenue(session),
  );
  if (sessionWithVenue) {
    return formatSessionLocation(sessionWithVenue);
  }

  return "Add your first venue";
}

export function getProfileDescription(profile: ClubProfile): string {
  return (
    profile.shortDescription?.trim() ||
    profile.longDescription?.trim() ||
    profile.profileDesign?.aboutText?.trim() ||
    profile.tagline?.trim() ||
    "Add a short description so parents know what your club offers."
  );
}

export async function fetchNewClubModeState(): Promise<NewClubModeState> {
  const { loadSessionsWithMeta } = await import("@/lib/data");
  const { fetchClubProfileFromApi } = await import("@/lib/club-profile/client");
  const { loadProviderVenues } = await import("@/lib/data/provider-venues");

  const [sessionsResult, profileResult, setupProgressResult, vatThresholdResult] =
    await Promise.all([
      loadSessionsWithMeta(),
      fetchClubProfileFromApi(),
      fetchSetupProgressFromApi(),
      fetch("/api/club/vat-threshold", { cache: "no-store" })
        .then(async (response) =>
          response.ok ? ((await response.json()) as { rollingTwelveMonthRevenue?: number }) : null,
        )
        .catch(() => null),
    ]);
  const sessions = sessionsResult.data;

  const profile = profileResult.ok ? profileResult.profile : getClubProfile();

  let hasProviderVenues = false;
  try {
    const venues = await loadProviderVenues();
    hasProviderVenues = venues.length > 0;
  } catch {
    hasProviderVenues = false;
  }

  const setupProgress = setupProgressResult.ok
    ? setupProgressResult.progress
    : computeSetupProgressFromSessions(sessions, profile);

  const rollingTwelveMonthRevenue =
    vatThresholdResult?.rollingTwelveMonthRevenue ?? 0;

  return getNewClubModeState(
    sessions,
    profile,
    hasProviderVenues,
    setupProgress,
    rollingTwelveMonthRevenue,
  );
}

/** Nav sections hidden until the first activity is published. */
export const NEW_CLUB_HIDDEN_NAV_SECTIONS = new Set([
  "communications",
  "discounts",
  "partners",
  "website_widget",
  "shares",
  "reviews",
]);

/** Nav sections highlighted during new club mode. */
export const NEW_CLUB_HIGHLIGHTED_NAV_SECTIONS = new Set([
  "dashboard",
  "activities",
  "customers",
  "finance",
]);
