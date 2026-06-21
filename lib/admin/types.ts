/**
 * Activora platform admin types.
 *
 * Storage (today): localStorage `activora-admin-session`
 * Database: `admin_users` + `platform_settings`
 */

export type AdminRole =
  | "owner"
  | "super_admin"
  | "support_admin"
  | "finance_admin"
  | "content_admin"
  | "read_only";

export type AdminNavSection =
  | "dashboard"
  | "providers"
  | "activities"
  | "bookings"
  | "messages"
  | "bugs"
  | "careers"
  | "partnerships"
  | "partners"
  | "contact"
  | "releases"
  | "translations"
  | "communications"
  | "reviews"
  | "finance"
  | "settings"
  | "plans"
  | "users";

export type ProviderStripeStatus =
  | "not_connected"
  | "action_required"
  | "connected"
  | "restricted"
  | "payouts_enabled";

export type ProviderAccountStatus = "active" | "paused" | "suspended";

import type { ProviderOrganisationType } from "./organisation-types";
import type { AdminProviderPlanId } from "./provider-plans";
import type { AdminVatFlag } from "@/lib/club-finance/vat-threshold";

export type { ProviderOrganisationType } from "./organisation-types";
export type { AdminProviderPlanId } from "./provider-plans";

export type AdminPaymentProviderMode =
  | "stripe_only"
  | "gocardless_only"
  | "both"
  | "not_connected";

export type PlatformSettings = {
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  platformUrl: string;
  defaultCurrency: string;
  country: string;
  vatThreshold: number;
  marketplaceFooterText: string;
  marketplaceEnabled: boolean;
  aiAssistantEnabled: boolean;
};

export type AdminOverviewMetrics = {
  totalProviders: number;
  totalBookings: number;
  platformRevenue: number;
  openSupportMessages: number;
};

export type AdminProvider = {
  id: string;
  clubName: string;
  ownerName: string;
  email: string;
  organisationType: ProviderOrganisationType;
  clubsCount: number;
  stripeStatus: ProviderStripeStatus;
  gocardlessStatus: string;
  paymentProviderMode: AdminPaymentProviderMode;
  paymentMethodsEnabled: string;
  paymentMethodStripeCard: boolean;
  paymentMethodGoCardlessDd: boolean;
  paymentMethodManualInvoice: boolean;
  subscriptionPlan: string;
  planId: AdminProviderPlanId;
  totalRevenue: number;
  rollingTwelveMonthRevenue: number;
  vatRegistrationNumber: string;
  vatFlags: AdminVatFlag[];
  hasPaymentData: boolean;
  accountStatus: ProviderAccountStatus;
  verified: boolean;
  joinedAt: string;
};

export type AdminFinanceSummary = {
  platformFeePercent: number;
  totalPlatformFeesEarned: number;
  stripePlatformFees: number;
  pendingPayouts: number;
  failedPayments: number;
  refunds: number;
  openDisputes: number;
  vatThreshold: number;
  rollingTwelveMonthRevenue: number;
};

export type PlatformFeeByProvider = {
  providerId: string;
  clubName: string;
  bookings: number;
  grossRevenue: number;
  platformFees: number;
};

export type ActivityStatus =
  | "published"
  | "paused"
  | "cancelled"
  | "draft"
  | "unpublished";

export type ActivityVisibility = "public" | "hidden";

export type AdminActivity = {
  id: string;
  title: string;
  providerId: string;
  providerName: string;
  venue: string;
  day: string;
  dayRaw: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookingsCount: number;
  price: number;
  status: ActivityStatus;
  visibility: ActivityVisibility;
  createdAt: string;
};

export type BookingPaymentStatus =
  | "paid"
  | "pending"
  | "failed"
  | "refunded"
  | "partial_refund";

export type AdminBooking = {
  id: string;
  reference: string;
  parentName: string;
  childName: string;
  email: string;
  activityId: string;
  activityTitle: string;
  providerId: string;
  providerName: string;
  sessionDate: string;
  status: "pending" | "confirmed" | "cancelled" | "refund_requested";
  paymentStatus: BookingPaymentStatus;
  amount: number;
  notes: string;
  createdAt: string;
};

export type AdminProviderDetail = AdminProvider & {
  phone: string;
  location: string;
  slug: string;
  description: string;
  website: string;
  stripeAccountId: string;
  totalBookings: number;
  pendingPayout: number;
  platformFeesPaid: number;
  paymentMethodStripeCard: boolean;
  paymentMethodGoCardlessDd: boolean;
  paymentMethodManualInvoice: boolean;
};

import type {
  ProviderHiddenReason,
  ProviderLifecycleStatus,
} from "./provider-status";

export type AdminHiddenProvider = {
  id: string;
  name: string;
  email: string | null;
  lifecycleStatus: ProviderLifecycleStatus;
  hiddenReasons: ProviderHiddenReason[];
  queryError: string | null;
  createdAt: string;
};

export type AdminProvidersDiagnostics = {
  totalProviderRows: number;
  totalVisibleRows: number;
  hiddenCount: number;
  hiddenReason: string | null;
  queryClient: "service_role" | "anon";
  hiddenProviders: AdminHiddenProvider[];
  orphanedClubAuthUsers: Array<{
    authUserId: string;
    email: string;
    name: string;
  }>;
};

export type AdminProvidersListResult = {
  providers: AdminProvider[];
  dataSource: "supabase" | "env_missing";
  diagnostics: AdminProvidersDiagnostics | null;
};

export type AdminSession = {
  adminId: string;
  email: string;
  name: string;
  role: AdminRole;
};
