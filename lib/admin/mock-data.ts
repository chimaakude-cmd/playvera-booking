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
> = {
  organisationType: "club",
  clubsCount: 0,
  paymentMethodStripeCard: true,
  paymentMethodGoCardlessDd: false,
  paymentMethodManualInvoice: false,
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

export const MOCK_ACTIVITIES: AdminActivity[] = [
  {
    id: "act_001",
    title: "Saturday Football Skills (Ages 5–7)",
    providerId: "prov_001",
    providerName: "Riverside FC Academy",
    venue: "Riverside Sports Centre",
    day: "Saturday",
    startTime: "09:00",
    endTime: "10:00",
    capacity: 16,
    bookingsCount: 14,
    price: 12,
    status: "published",
    visibility: "public",
    createdAt: "2025-01-15",
  },
  {
    id: "act_002",
    title: "Mini Kickers Trial",
    providerId: "prov_002",
    providerName: "Little Kickers Leeds",
    venue: "Leeds Community Hall",
    day: "Wednesday",
    startTime: "16:30",
    endTime: "17:15",
    capacity: 12,
    bookingsCount: 8,
    price: 0,
    status: "published",
    visibility: "public",
    createdAt: "2025-02-20",
  },
  {
    id: "act_003",
    title: "Gymnastics Beginners",
    providerId: "prov_003",
    providerName: "North Star Gymnastics",
    venue: "North Star Studio",
    day: "Thursday",
    startTime: "17:00",
    endTime: "18:00",
    capacity: 10,
    bookingsCount: 10,
    status: "paused",
    visibility: "public",
    price: 15,
    createdAt: "2025-03-10",
  },
  {
    id: "act_004",
    title: "Holiday Swim Camp",
    providerId: "prov_004",
    providerName: "City Swim School",
    venue: "City Pool",
    day: "Monday",
    startTime: "10:00",
    endTime: "12:00",
    capacity: 20,
    bookingsCount: 3,
    price: 25,
    status: "draft",
    visibility: "hidden",
    createdAt: "2025-05-12",
  },
  {
    id: "act_005",
    title: "Street Dance Crew",
    providerId: "prov_005",
    providerName: "Peak Dance Collective",
    venue: "Peak Studio 2",
    day: "Friday",
    startTime: "18:00",
    endTime: "19:30",
    capacity: 18,
    bookingsCount: 16,
    price: 14,
    status: "published",
    visibility: "public",
    createdAt: "2024-12-01",
  },
];

export const MOCK_BOOKINGS: AdminBooking[] = [
  {
    id: "bkg_001",
    reference: "ACT-2026-00142",
    parentName: "Helen Wright",
    childName: "Oliver Wright",
    email: "helen.wright@example.com",
    activityId: "act_001",
    activityTitle: "Saturday Football Skills (Ages 5–7)",
    providerId: "prov_001",
    providerName: "Riverside FC Academy",
    sessionDate: "2026-06-21",
    status: "confirmed",
    paymentStatus: "paid",
    amount: 12,
    notes: "",
    createdAt: "2026-06-10T14:22:00Z",
  },
  {
    id: "bkg_002",
    reference: "ACT-2026-00138",
    parentName: "Marcus Chen",
    childName: "Lily Chen",
    email: "marcus.chen@example.com",
    activityId: "act_002",
    activityTitle: "Mini Kickers Trial",
    providerId: "prov_002",
    providerName: "Little Kickers Leeds",
    sessionDate: "2026-06-18",
    status: "confirmed",
    paymentStatus: "paid",
    amount: 0,
    notes: "First trial session",
    createdAt: "2026-06-09T09:15:00Z",
  },
  {
    id: "bkg_003",
    reference: "ACT-2026-00129",
    parentName: "Sarah Patel",
    childName: "Arjun Patel",
    email: "sarah.patel@example.com",
    activityId: "act_003",
    activityTitle: "Gymnastics Beginners",
    providerId: "prov_003",
    providerName: "North Star Gymnastics",
    sessionDate: "2026-06-19",
    status: "refund_requested",
    paymentStatus: "paid",
    amount: 15,
    notes: "Parent requested refund — session paused",
    createdAt: "2026-06-05T11:40:00Z",
  },
  {
    id: "bkg_004",
    reference: "ACT-2026-00155",
    parentName: "Tom Baker",
    childName: "Ella Baker",
    email: "tom.baker@example.com",
    activityId: "act_005",
    activityTitle: "Street Dance Crew",
    providerId: "prov_005",
    providerName: "Peak Dance Collective",
    sessionDate: "2026-06-20",
    status: "pending",
    paymentStatus: "failed",
    amount: 14,
    notes: "Card declined — follow up",
    createdAt: "2026-06-13T16:05:00Z",
  },
  {
    id: "bkg_005",
    reference: "ACT-2026-00101",
    parentName: "Emma Jones",
    childName: "Noah Jones",
    email: "emma.jones@example.com",
    activityId: "act_001",
    activityTitle: "Saturday Football Skills (Ages 5–7)",
    providerId: "prov_001",
    providerName: "Riverside FC Academy",
    sessionDate: "2026-06-14",
    status: "cancelled",
    paymentStatus: "refunded",
    amount: 12,
    notes: "Cancelled by parent",
    createdAt: "2026-05-28T08:30:00Z",
  },
];

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

export function getActivityById(id: string): AdminActivity | undefined {
  return MOCK_ACTIVITIES.find((a) => a.id === id);
}

export function getBookingById(id: string): AdminBooking | undefined {
  return MOCK_BOOKINGS.find((b) => b.id === id);
}

export function getBookingsForProvider(providerId: string): AdminBooking[] {
  return MOCK_BOOKINGS.filter((b) => b.providerId === providerId);
}

export function getActivitiesForProvider(providerId: string): AdminActivity[] {
  return MOCK_ACTIVITIES.filter((a) => a.providerId === providerId);
}
