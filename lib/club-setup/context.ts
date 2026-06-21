import type { ClubProfile } from "@/lib/club-profile/types";
import type { ClubSession } from "@/lib/sessions";

export type SetupProgressContext = {
  sessions: ClubSession[];
  profile: ClubProfile;
  stripeConnected: boolean;
  stripePayoutReady: boolean;
  paymentsConfigured: boolean;
  hasTeamMembers: boolean;
  hasVatDetails: boolean;
  hasBookingQuestionsConfigured: boolean;
  hasPayoutPreferencesConfigured: boolean;
};
