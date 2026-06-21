export type PlanSlug = "FREE" | "PRO" | "FRANCHISOR" | "ENTERPRISE";

export type SupportLevel = "standard" | "priority" | "urgent";

export type SubscriptionPlanRow = {
  id: string;
  slug: string;
  display_name: string;
  description: string;
  monthly_price: number;
  monthly_price_is_minimum: boolean;
  booking_fee_percent: number;
  activity_limit: number | null;
  club_limit: number | null;
  support_level: SupportLevel;
  dedicated_manager: boolean;
  quarterly_calls_enabled: boolean;
  early_access_enabled: boolean;
  unlimited_activities: boolean;
  unlimited_clubs: boolean;
  enabled: boolean;
  sort_order: number;
  response_target_hours: number | null;
  priority_support: boolean;
  urgent_support: boolean;
  features: string[];
  cta: string;
  highlighted: boolean;
  contact_sales: boolean;
  created_at: string;
  updated_at: string;
};

export type SubscriptionPlan = {
  id: string;
  slug: PlanSlug;
  displayName: string;
  description: string;
  monthlyPrice: number;
  monthlyPriceIsMinimum: boolean;
  bookingFeePercent: number;
  activityLimit: number | null;
  clubLimit: number | null;
  supportLevel: SupportLevel;
  dedicatedManager: boolean;
  quarterlyCallsEnabled: boolean;
  earlyAccessEnabled: boolean;
  unlimitedActivities: boolean;
  unlimitedClubs: boolean;
  enabled: boolean;
  sortOrder: number;
  responseTargetHours: number | null;
  prioritySupport: boolean;
  urgentSupport: boolean;
  features: string[];
  cta: string;
  highlighted: boolean;
  contactSales: boolean;
};

export type SubscriptionPlanUpdate = Partial<
  Omit<SubscriptionPlan, "id" | "slug">
>;

export type PlanUsageContext = {
  activityCount?: number;
  clubCount?: number;
};

export type PlanFeatureFlags = {
  quarterlyCalls: boolean;
  earlyAccess: boolean;
  dedicatedManager: boolean;
  prioritySupport: boolean;
  urgentSupport: boolean;
};

export type PlanCapabilities = {
  canCreateActivity: boolean;
  canCreateClub: boolean;
  supportLevel: SupportLevel;
  activityLimit: number | null;
  clubLimit: number | null;
  bookingFee: number;
  featureFlags: PlanFeatureFlags;
  responseTargetHours: number | null;
};
