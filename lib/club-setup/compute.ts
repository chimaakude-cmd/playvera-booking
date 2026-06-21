import type { ClubProfile } from "@/lib/club-profile/types";
import type { ClubSession } from "@/lib/sessions";
import type { SetupProgressContext } from "./context";
import {
  SETUP_BASE_PERCENT,
  SETUP_TASK_WEIGHTS,
  type SetupProgressResult,
  type SetupTask,
  type SetupTaskId,
} from "./types";

function hasSocialLinks(profile: ClubProfile): boolean {
  return Object.values(profile.socialLinks).some(
    (value) => value.trim().length > 0,
  );
}

function hasCoverImage(profile: ClubProfile): boolean {
  return Boolean(
    profile.coverImageUrl?.trim() || profile.profileDesign?.coverUrl,
  );
}

function hasVatDetails(context: SetupProgressContext): boolean {
  return context.hasVatDetails;
}

function isTaskCompleted(
  id: SetupTaskId,
  context: SetupProgressContext,
): boolean {
  switch (id) {
    case "connect_payments":
      return context.paymentsConfigured;
    case "add_social":
      return hasSocialLinks(context.profile);
    case "configure_payouts":
      return context.hasPayoutPreferencesConfigured;
    case "add_team":
      return context.hasTeamMembers;
    case "create_session":
      return context.sessions.length > 0;
    case "booking_questions":
      return context.hasBookingQuestionsConfigured;
    case "upload_cover":
      return hasCoverImage(context.profile);
    case "add_vat":
      return hasVatDetails(context);
    case "connect_bookkeeping":
      return false;
    default:
      return false;
  }
}

const TASK_DEFINITIONS: Omit<SetupTask, "completed">[] = [
  {
    id: "connect_payments",
    label: "Connect payment provider",
    description: "Connect Stripe and/or GoCardless to accept payments.",
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

export function computeSetupProgress(
  context: SetupProgressContext,
): SetupProgressResult {
  const tasks: SetupTask[] = TASK_DEFINITIONS.map((task) => ({
    ...task,
    completed: isTaskCompleted(task.id, context),
  }));
  const earned = tasks.reduce(
    (sum, task) => sum + (task.completed ? SETUP_TASK_WEIGHTS[task.id] : 0),
    0,
  );
  const percent = Math.min(100, SETUP_BASE_PERCENT + earned);

  return { percent, tasks };
}

export function computeSetupProgressFromSessions(
  sessions: ClubSession[],
  profile: ClubProfile,
  partial?: Partial<Omit<SetupProgressContext, "sessions" | "profile">>,
): SetupProgressResult {
  return computeSetupProgress({
    sessions,
    profile,
    stripeConnected: partial?.stripeConnected ?? false,
    stripePayoutReady: partial?.stripePayoutReady ?? false,
    paymentsConfigured: partial?.paymentsConfigured ?? false,
    hasTeamMembers: partial?.hasTeamMembers ?? false,
    hasBookingQuestionsConfigured:
      partial?.hasBookingQuestionsConfigured ?? false,
    hasPayoutPreferencesConfigured:
      partial?.hasPayoutPreferencesConfigured ?? false,
    hasVatDetails: partial?.hasVatDetails ?? false,
  });
}
