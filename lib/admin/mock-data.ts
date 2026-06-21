import type {
  AdminActivity,
  AdminBooking,
  AdminFinanceSummary,
  AdminOverviewMetrics,
  AdminProvider,
  AdminProviderDetail,
  PlatformFeeByProvider,
} from "./types";

const MOCK_PROVIDER_DEFAULTS: Pick<
  AdminProvider,
  | "organisationType"
  | "clubsCount"
  | "paymentMethodStripeCard"
  | "paymentMethodGoCardlessDd"
  | "paymentMethodManualInvoice"
  | "rollingTwelveMonthRevenue"
  | "vatRegistrationNumber"
  | "vatFlags"
> = {
  organisationType: "club",
  clubsCount: 0,
  paymentMethodStripeCard: true,
  paymentMethodGoCardlessDd: false,
  paymentMethodManualInvoice: false,
  rollingTwelveMonthRevenue: 0,
  vatRegistrationNumber: "",
  vatFlags: [],
};

export const MOCK_OVERVIEW_METRICS: AdminOverviewMetrics = {
  totalProviders: 24,
  totalBookings: 6128,
  platformRevenue: 5_695,
  openSupportMessages: 4,
};

export const MOCK_PROVIDERS: AdminProvider[] = [
  {
    ...MOCK_PROVIDER_DEFAULTS,
    id: "prov_001",
    clubName: "Riverside FC Academy",
    ownerName: "Sarah Mitchell",
    email: "sarah@riversidefc.co.uk",
    organisationType: "club",
    clubsCount: 0,
    stripeStatus: "payouts_enabled",
    gocardlessStatus: "not_connected",
    paymentProviderMode: "stripe_only",
    paymentMethodsEnabled: "Card",
    paymentMethodStripeCard: true,
    paymentMethodGoCardlessDd: false,
    paymentMethodManualInvoice: false,
    subscriptionPlan: "Growth",
    planId: "GROWTH",
    totalRevenue: 0,
    hasPaymentData: false,
    accountStatus: "active",
    verified: true,
    joinedAt: "2024-09-12",
  },
  {
    ...MOCK_PROVIDER_DEFAULTS,
    id: "prov_002",
    clubName: "Little Kickers Leeds",
    ownerName: "James Okafor",
    email: "james@littlekickersleeds.com",
    stripeStatus: "connected",
    gocardlessStatus: "not_connected",
    paymentProviderMode: "stripe_only",
    paymentMethodsEnabled: "Card",
    subscriptionPlan: "Starter",
    planId: "STARTER",
    totalRevenue: 0,
    hasPaymentData: false,
    accountStatus: "active",
    verified: true,
    joinedAt: "2025-01-08",
  },
  {
    ...MOCK_PROVIDER_DEFAULTS,
    id: "prov_003",
    clubName: "North Star Gymnastics",
    ownerName: "Emma Clarke",
    email: "emma@northstargym.co.uk",
    stripeStatus: "action_required",
    gocardlessStatus: "pending_setup",
    paymentProviderMode: "not_connected",
    paymentMethodsEnabled: "None",
    subscriptionPlan: "Starter",
    planId: "STARTER",
    totalRevenue: 0,
    hasPaymentData: false,
    accountStatus: "active",
    verified: false,
    joinedAt: "2025-03-22",
  },
  {
    ...MOCK_PROVIDER_DEFAULTS,
    id: "prov_004",
    clubName: "City Swim School",
    ownerName: "David Park",
    email: "david@cityswim.co.uk",
    stripeStatus: "not_connected",
    gocardlessStatus: "not_connected",
    paymentProviderMode: "not_connected",
    paymentMethodsEnabled: "None",
    subscriptionPlan: "Free",
    planId: "FREE",
    totalRevenue: 0,
    hasPaymentData: false,
    accountStatus: "paused",
    verified: false,
    joinedAt: "2025-05-01",
  },
  {
    ...MOCK_PROVIDER_DEFAULTS,
    paymentMethodStripeCard: true,
    paymentMethodGoCardlessDd: true,
    id: "prov_005",
    clubName: "Peak Dance Collective",
    ownerName: "Priya Sharma",
    email: "priya@peakdance.co.uk",
    stripeStatus: "restricted",
    gocardlessStatus: "connected",
    paymentProviderMode: "both",
    paymentMethodsEnabled: "Card, Direct Debit",
    subscriptionPlan: "Growth",
    planId: "GROWTH",
    totalRevenue: 0,
    hasPaymentData: false,
    accountStatus: "suspended",
    verified: true,
    joinedAt: "2024-11-30",
  },
];

export const MOCK_FINANCE_SUMMARY: AdminFinanceSummary = {
  platformFeePercent: 2,
  totalPlatformFeesEarned: 5_695,
  stripePlatformFees: 8_542,
  pendingPayouts: 12_480,
  failedPayments: 23,
  refunds: 1_240,
  openDisputes: 2,
  vatThreshold: 90_000,
  rollingTwelveMonthRevenue: 284_750,
};

export const MOCK_PLATFORM_FEES_BY_PROVIDER: PlatformFeeByProvider[] = [
  {
    providerId: "prov_001",
    clubName: "Riverside FC Academy",
    bookings: 1240,
    grossRevenue: 48_200,
    platformFees: 964,
  },
  {
    providerId: "prov_002",
    clubName: "Little Kickers Leeds",
    bookings: 680,
    grossRevenue: 21_450,
    platformFees: 429,
  },
  {
    providerId: "prov_003",
    clubName: "North Star Gymnastics",
    bookings: 312,
    grossRevenue: 9_870,
    platformFees: 197,
  },
  {
    providerId: "prov_005",
    clubName: "Peak Dance Collective",
    bookings: 890,
    grossRevenue: 31_600,
    platformFees: 632,
  },
];

export const PROVIDER_STRIPE_STATUS_LABELS: Record<
  AdminProvider["stripeStatus"],
  string
> = {
  not_connected: "Not connected",
  action_required: "Action required",
  connected: "Connected",
  restricted: "Restricted",
  payouts_enabled: "Payouts enabled",
};

export const PROVIDER_ACCOUNT_STATUS_LABELS: Record<
  AdminProvider["accountStatus"],
  string
> = {
  active: "Active",
  paused: "Paused",
  suspended: "Suspended",
};

export const ACTIVITY_STATUS_LABELS: Record<
  AdminActivity["status"],
  string
> = {
  published: "Published",
  paused: "Paused",
  cancelled: "Cancelled",
  draft: "Draft",
  unpublished: "Unpublished",
};

export const BOOKING_PAYMENT_STATUS_LABELS: Record<
  AdminBooking["paymentStatus"],
  string
> = {
  paid: "Paid",
  pending: "Pending",
  failed: "Failed",
  refunded: "Refunded",
  partial_refund: "Partial refund",
};

export const MOCK_PROVIDER_DETAILS: Record<string, AdminProviderDetail> = {
  prov_001: {
    ...MOCK_PROVIDERS[0],
    phone: "0113 496 1234",
    location: "Leeds, West Yorkshire",
    slug: "riverside-fc",
    description:
      "Community football academy offering weekly skills sessions for ages 4–12.",
    website: "https://riversidefc.co.uk",
    stripeAccountId: "acct_demo_riverside",
    totalBookings: 0,
    pendingPayout: 0,
    platformFeesPaid: 0,
    paymentMethodStripeCard: true,
    paymentMethodGoCardlessDd: false,
    paymentMethodManualInvoice: false,
  },
  prov_002: {
    ...MOCK_PROVIDERS[1],
    phone: "0113 555 7890",
    location: "Leeds, West Yorkshire",
    slug: "little-kickers-leeds",
    description: "Fun football classes for toddlers and pre-schoolers.",
    website: "https://littlekickersleeds.com",
    stripeAccountId: "acct_demo_lk",
    totalBookings: 0,
    pendingPayout: 0,
    platformFeesPaid: 0,
    paymentMethodStripeCard: true,
    paymentMethodGoCardlessDd: false,
    paymentMethodManualInvoice: false,
  },
  prov_003: {
    ...MOCK_PROVIDERS[2],
    phone: "0114 222 3344",
    location: "Sheffield, South Yorkshire",
    slug: "north-star-gymnastics",
    description: "Recreational and competitive gymnastics for all ages.",
    website: "https://northstargym.co.uk",
    stripeAccountId: "acct_demo_nsg",
    totalBookings: 0,
    pendingPayout: 0,
    platformFeesPaid: 0,
    paymentMethodStripeCard: false,
    paymentMethodGoCardlessDd: false,
    paymentMethodManualInvoice: false,
  },
  prov_004: {
    ...MOCK_PROVIDERS[3],
    phone: "0117 888 9900",
    location: "Bristol",
    slug: "city-swim-school",
    description: "Learn-to-swim programmes and holiday camps.",
    website: "https://cityswim.co.uk",
    stripeAccountId: "",
    totalBookings: 0,
    pendingPayout: 0,
    platformFeesPaid: 0,
    paymentMethodStripeCard: false,
    paymentMethodGoCardlessDd: false,
    paymentMethodManualInvoice: false,
  },
  prov_005: {
    ...MOCK_PROVIDERS[4],
    phone: "0161 444 5566",
    location: "Manchester",
    slug: "peak-dance",
    description: "Street, contemporary, and ballet classes.",
    website: "https://peakdance.co.uk",
    stripeAccountId: "acct_demo_peak",
    totalBookings: 0,
    pendingPayout: 0,
    platformFeesPaid: 0,
    paymentMethodStripeCard: true,
    paymentMethodGoCardlessDd: true,
    paymentMethodManualInvoice: false,
  },
};

export function getProviderById(id: string): AdminProviderDetail | undefined {
  return MOCK_PROVIDER_DETAILS[id];
}
