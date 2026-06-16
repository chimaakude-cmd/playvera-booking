import type {
  FranchiseeClub,
  Organisation,
  OrganisationActivityItem,
  OrganisationDashboardStats,
  OrganisationNotificationItem,
  OrganisationPermissionPolicy,
  OrganisationUser,
} from "./types";

export const DEMO_ORGANISATION_ID = "org_playvera_franchise";
export const DEMO_FRANCHISEE_PROVIDER_ID = "local-provider";

export const DEFAULT_ORGANISATION: Organisation = {
  id: DEMO_ORGANISATION_ID,
  name: "PlayVera Franchise Group",
  slug: "playvera-franchise",
  franchisorControlsPayouts: true,
  plan: {
    planName: "Franchisor Growth",
    monthlyFeePence: 29900,
    includedClubs: 5,
    extraClubFeePence: 4900,
    platformFeePercent: 2.5,
    billingStatus: "trial",
  },
  createdAt: "2026-01-15T09:00:00.000Z",
  updatedAt: "2026-06-01T10:00:00.000Z",
};

export const DEFAULT_ORGANISATION_USERS: OrganisationUser[] = [
  {
    id: "org_user_001",
    organisationId: DEMO_ORGANISATION_ID,
    userId: "organisation_demo_001",
    email: "organisation@test.activeora.co.uk",
    name: "Organisation Owner",
    role: "owner",
  },
];

export const DEFAULT_FRANCHISEE_CLUBS: FranchiseeClub[] = [
  {
    id: "franchisee_club_001",
    organisationId: DEMO_ORGANISATION_ID,
    providerId: DEMO_FRANCHISEE_PROVIDER_ID,
    name: "PlayVera Juniors — Central",
    area: "London, SW1",
    managerName: "Club Owner",
    managerEmail: "club@test.activeora.co.uk",
    status: "active",
    stripeStatus: "connected",
    bookingsCount: 248,
    revenuePence: 1845000,
    createdAt: "2026-02-01T09:00:00.000Z",
    updatedAt: "2026-06-01T10:00:00.000Z",
  },
  {
    id: "franchisee_club_002",
    organisationId: DEMO_ORGANISATION_ID,
    providerId: "provider_north",
    name: "PlayVera Juniors — North",
    area: "Manchester, M1",
    managerName: "Sarah Mitchell",
    managerEmail: "north@playvera.example",
    status: "active",
    stripeStatus: "connected",
    bookingsCount: 156,
    revenuePence: 1120000,
    createdAt: "2026-03-10T09:00:00.000Z",
    updatedAt: "2026-06-01T10:00:00.000Z",
  },
  {
    id: "franchisee_club_003",
    organisationId: DEMO_ORGANISATION_ID,
    providerId: "provider_east",
    name: "PlayVera Juniors — East",
    area: "Norwich, NR1",
    managerName: "James Chen",
    managerEmail: "east@playvera.example",
    status: "pending",
    stripeStatus: "pending",
    bookingsCount: 0,
    revenuePence: 0,
    createdAt: "2026-05-20T09:00:00.000Z",
    updatedAt: "2026-05-20T09:00:00.000Z",
  },
];

export const DEFAULT_ORG_DASHBOARD_STATS: OrganisationDashboardStats = {
  activeSessions: 18,
  pendingPayoutsPence: 124_800,
};

export const DEFAULT_ORG_ACTIVITY_FEED: OrganisationActivityItem[] = [
  {
    id: "act_001",
    message: "New booking at PlayVera Juniors — Central",
    timestamp: "2026-06-14T09:15:00.000Z",
    clubName: "PlayVera Juniors — Central",
  },
  {
    id: "act_002",
    message: "Franchisee club onboarding completed",
    timestamp: "2026-06-13T16:40:00.000Z",
    clubName: "PlayVera Juniors — North",
  },
  {
    id: "act_003",
    message: "Payout scheduled for 3 franchisee clubs",
    timestamp: "2026-06-13T08:00:00.000Z",
  },
  {
    id: "act_004",
    message: "New franchisee club pending approval",
    timestamp: "2026-06-12T14:22:00.000Z",
    clubName: "PlayVera Juniors — East",
  },
];

export const DEFAULT_ORG_NOTIFICATIONS: OrganisationNotificationItem[] = [
  {
    id: "notif_001",
    title: "Payout review due",
    body: "3 franchisee clubs have pending payouts totalling £1,248.",
    timestamp: "2026-06-14T07:30:00.000Z",
    unread: true,
  },
  {
    id: "notif_002",
    title: "New franchisee signup",
    body: "PlayVera Juniors — East is awaiting approval.",
    timestamp: "2026-06-12T14:22:00.000Z",
    unread: true,
  },
  {
    id: "notif_003",
    title: "Monthly report ready",
    body: "Your group revenue report for May is available.",
    timestamp: "2026-06-01T09:00:00.000Z",
    unread: false,
  },
];

export const DEFAULT_PERMISSION_POLICY: OrganisationPermissionPolicy = {
  organisationId: DEMO_ORGANISATION_ID,
  franchiseeCanEdit: {
    profile: false,
    activities: true,
    venues: true,
    staff: false,
    finance: false,
    discounts: true,
    communications: true,
    public_page: false,
  },
  payoutScheduleControlledByFranchisor: true,
  updatedAt: "2026-06-01T10:00:00.000Z",
};
