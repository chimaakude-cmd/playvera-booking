import { createDefaultBookingQuestions } from "@/lib/booking-questions";
import { getClubProfile } from "@/lib/club-profile";
import { CLUB_DEFAULT_BOOKING_QUESTIONS_KEY } from "@/lib/club-onboarding/types";
import { getClubTeamState } from "@/lib/club-team/storage";
import { getVatSettings } from "@/lib/club-finance/vat-settings";
import { getClubPayoutPreferences } from "@/lib/finance-payouts/storage";
import { DEMO_FRANCHISEE_PROVIDER_ID } from "@/lib/organisation/defaults";
import { isClubPaymentsConfigured } from "@/lib/payment-providers/availability";
import {
  getStripeConnectState,
  isStripeConnected,
  isStripePayoutReady,
} from "@/lib/stripe-connect";
import { getSessions, type ClubSession } from "@/lib/sessions";
import type { ClubProfile } from "@/lib/club-profile/types";
import { computeSetupProgress } from "./compute";
import type { SetupProgressContext } from "./context";
import type { SetupProgressResult } from "./types";

function hasBookingQuestionsConfiguredFromStorage(): boolean {
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

function buildClientSetupProgressContext(
  sessions: ClubSession[] = getSessions(),
  profile: ClubProfile = getClubProfile(),
): SetupProgressContext {
  const stripe = getStripeConnectState();
  const stripeStatus = stripe.status;
  const prefs = getClubPayoutPreferences(DEMO_FRANCHISEE_PROVIDER_ID);
  const vat = getVatSettings();
  const team = getClubTeamState();

  return {
    sessions,
    profile,
    stripeConnected: isStripeConnected(stripeStatus),
    stripePayoutReady: isStripePayoutReady(stripeStatus),
    paymentsConfigured: isClubPaymentsConfigured(),
    hasTeamMembers: team.members.some((member) => !member.isOwner),
    hasVatDetails:
      vat.isVatRegistered && vat.vatRegistrationNumber.trim().length > 0,
    hasBookingQuestionsConfigured: hasBookingQuestionsConfiguredFromStorage(),
    hasPayoutPreferencesConfigured:
      isStripePayoutReady(stripeStatus) || Boolean(prefs.nextEstimatedPayout),
    rollingTwelveMonthRevenue: 0,
  };
}

export function getSetupProgressFromContext(
  context: SetupProgressContext,
): SetupProgressResult {
  return computeSetupProgress(context);
}

export function getSetupProgressWithSessions(
  sessions: ClubSession[],
  profile?: ClubProfile,
): SetupProgressResult {
  return computeSetupProgress(
    buildClientSetupProgressContext(sessions, profile ?? getClubProfile()),
  );
}

/** @deprecated Prefer server-derived progress via fetchSetupProgressFromApi. */
export function getSetupProgress(): SetupProgressResult {
  return computeSetupProgress(buildClientSetupProgressContext());
}

export function getSetupTasks() {
  return getSetupProgress().tasks;
}
