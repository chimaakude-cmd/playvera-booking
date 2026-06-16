/**
 * Organisation / franchisor data model.
 *
 * Terminology:
 * - Franchisor = head office (organisation) managing multiple clubs
 * - Franchisee = individual club/location/provider
 *
 * Storage (today): localStorage keys in storage.ts
 * Database: future migration 00022_organisation_franchise.sql
 */

export type OrganisationRole = "owner" | "admin" | "manager" | "viewer";

export type OrganisationBillingStatus =
  | "active"
  | "trial"
  | "past_due"
  | "cancelled";

export type OrganisationPlan = {
  planName: string;
  monthlyFeePence: number;
  includedClubs: number;
  extraClubFeePence: number;
  platformFeePercent: number;
  billingStatus: OrganisationBillingStatus;
};

export type Organisation = {
  id: string;
  name: string;
  slug: string;
  plan: OrganisationPlan;
  /** When true, franchisor sets payout schedule for all franchisee clubs. */
  franchisorControlsPayouts: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OrganisationUser = {
  id: string;
  organisationId: string;
  userId: string;
  email: string;
  name: string;
  role: OrganisationRole;
};

export type FranchiseeClubStatus = "active" | "pending" | "suspended";

export type FranchiseeStripeStatus =
  | "connected"
  | "pending"
  | "not_connected";

export type FranchiseeClub = {
  id: string;
  organisationId: string;
  providerId: string;
  name: string;
  area: string;
  managerName: string;
  managerEmail: string;
  status: FranchiseeClubStatus;
  stripeStatus: FranchiseeStripeStatus;
  bookingsCount: number;
  revenuePence: number;
  createdAt: string;
  updatedAt: string;
};

export type FranchiseeEditableSetting =
  | "profile"
  | "activities"
  | "venues"
  | "staff"
  | "finance"
  | "discounts"
  | "communications"
  | "public_page";

export type OrganisationPermissionPolicy = {
  organisationId: string;
  franchiseeCanEdit: Record<FranchiseeEditableSetting, boolean>;
  /** When true, franchisee clubs cannot edit their own payout preferences. */
  payoutScheduleControlledByFranchisor: boolean;
  updatedAt: string;
};

export type FranchiseeClubInput = {
  name: string;
  area: string;
  managerName: string;
  managerEmail: string;
  status?: FranchiseeClubStatus;
  stripeStatus?: FranchiseeStripeStatus;
};

export const FRANCHISEE_SETTING_LABELS: Record<FranchiseeEditableSetting, string> =
  {
    profile: "Club profile",
    activities: "Activities",
    venues: "Venues",
    staff: "Staff",
    finance: "Finance",
    discounts: "Discounts",
    communications: "Communications",
    public_page: "Public page",
  };

export type OrganisationDashboardStats = {
  activeSessions: number;
  pendingPayoutsPence: number;
};

export type OrganisationActivityItem = {
  id: string;
  message: string;
  timestamp: string;
  clubName?: string;
};

export type OrganisationNotificationItem = {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  unread: boolean;
};
