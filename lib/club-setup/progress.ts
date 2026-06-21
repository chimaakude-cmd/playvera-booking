import { createDefaultBookingQuestions } from "@/lib/booking-questions";
import { getClubProfile } from "@/lib/club-profile";
import { CLUB_DEFAULT_BOOKING_QUESTIONS_KEY } from "@/lib/club-onboarding/types";
import { getClubTeamState } from "@/lib/club-team/storage";
import { getVatSettings } from "@/lib/club-finance/vat-settings";
import { getClubPayoutPreferences } from "@/lib/finance-payouts/storage";
import { DEMO_FRANCHISEE_PROVIDER_ID } from "@/lib/organisation/defaults";
import {
  getStripeConnectState,
  isStripeConnected,
  isStripePayoutReady,
} from "@/lib/stripe-connect";
import { getSessions } from "@/lib/sessions";
import {
  SETUP_BASE_PERCENT,
  SETUP_TASK_WEIGHTS,
  type SetupProgressResult,
  type SetupTask,
  type SetupTaskId,
} from "./types";

function hasSocialLinks(): boolean {
  const profile = getClubProfile();
  return Object.values(profile.socialLinks).some((value) => value.trim().length > 0);
}

function hasCoverImage(): boolean {
  const profile = getClubProfile();
  return Boolean(profile.coverImageUrl?.trim() || profile.profileDesign?.coverUrl);
}

function hasTeamMembers(): boolean {
  const team = getClubTeamState();
  return team.members.filter((member) => !member.isOwner).length > 0;
}

function hasSessions(): boolean {
  return getSessions().length > 0;
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

function hasPayoutPreferencesConfigured(): boolean {
  const prefs = getClubPayoutPreferences(DEMO_FRANCHISEE_PROVIDER_ID);
  const stripe = getStripeConnectState();
  return isStripePayoutReady(stripe.status) || Boolean(prefs.nextEstimatedPayout);
}

function isTaskCompleted(id: SetupTaskId): boolean {
  switch (id) {
    case "connect_stripe":
      return isStripeConnected(getStripeConnectState().status);
    case "add_social":
      return hasSocialLinks();
    case "configure_payouts":
      return hasPayoutPreferencesConfigured();
    case "add_team":
      return hasTeamMembers();
    case "create_session":
      return hasSessions();
    case "booking_questions":
      return hasBookingQuestionsConfigured();
    case "upload_cover":
      return hasCoverImage();
    case "add_vat":
      return hasVatDetails();
    case "connect_bookkeeping":
      return false;
    default:
      return false;
  }
}

const TASK_DEFINITIONS: Omit<SetupTask, "completed">[] = [
  {
    id: "connect_stripe",
    label: "Connect Stripe",
    description: "Accept card payments for paid sessions.",
    required: true,
    href: "/club/finance?tab=payment-providers",
  },
  {
    id: "add_social",
    label: "Add social links",
    description: "Help parents find you on social media.",
    required: false,
    href: "/club/settings/profile",
  },
  {
    id: "configure_payouts",
    label: "Configure payouts",
    description: "Set how often payouts reach your bank.",
    required: false,
    href: "/club/finance?tab=payouts",
  },
  {
    id: "add_team",
    label: "Add team",
    description: "Invite coaches and administrators.",
    required: false,
    href: "/club/settings/team",
  },
  {
    id: "create_session",
    label: "Create first session",
    description: "Publish an activity for parents to book.",
    required: false,
    href: "/club/create-session",
  },
  {
    id: "booking_questions",
    label: "Configure booking questions",
    description: "Customise parent registration questions.",
    required: false,
    href: "/club/settings/booking-questions",
  },
  {
    id: "upload_cover",
    label: "Upload cover image",
    description: "Make your public profile stand out.",
    required: false,
    href: "/club/settings/profile",
  },
  {
    id: "add_vat",
    label: "Add VAT details",
    description: "Register VAT if applicable to your club.",
    required: false,
    href: "/club/finance?tab=vat",
  },
  {
    id: "connect_bookkeeping",
    label: "Connect bookkeeping",
    description: "Sync transactions to your accounting software.",
    required: false,
    href: "/club/finance?tab=integrations",
  },
];

export function getSetupTasks(): SetupTask[] {
  return TASK_DEFINITIONS.map((task) => ({
    ...task,
    completed: isTaskCompleted(task.id),
  }));
}

export function getSetupProgress(): SetupProgressResult {
  const tasks = getSetupTasks();
  const earned = tasks.reduce(
    (sum, task) => sum + (task.completed ? SETUP_TASK_WEIGHTS[task.id] : 0),
    0,
  );
  const percent = Math.min(100, SETUP_BASE_PERCENT + earned);

  return { percent, tasks };
}
