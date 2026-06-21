import type {
  PlanSlug,
  SubscriptionPlan,
  SubscriptionPlanRow,
  SubscriptionPlanUpdate,
} from "./types";
import { normalizePlanSlug } from "./defaults";

function parseFeatures(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return [];
}

export function rowToSubscriptionPlan(row: SubscriptionPlanRow): SubscriptionPlan {
  return {
    id: row.id,
    slug: normalizePlanSlug(row.slug),
    displayName: row.display_name,
    description: row.description,
    monthlyPrice: Number(row.monthly_price),
    monthlyPriceIsMinimum: row.monthly_price_is_minimum,
    bookingFeePercent: Number(row.booking_fee_percent),
    activityLimit: row.activity_limit,
    clubLimit: row.club_limit,
    supportLevel: row.support_level,
    dedicatedManager: row.dedicated_manager,
    quarterlyCallsEnabled: row.quarterly_calls_enabled,
    earlyAccessEnabled: row.early_access_enabled,
    unlimitedActivities: row.unlimited_activities,
    unlimitedClubs: row.unlimited_clubs,
    enabled: row.enabled,
    sortOrder: row.sort_order,
    responseTargetHours: row.response_target_hours,
    prioritySupport: row.priority_support,
    urgentSupport: row.urgent_support,
    features: parseFeatures(row.features),
    cta: row.cta,
    highlighted: row.highlighted,
    contactSales: row.contact_sales,
  };
}

export function updateToRowPatch(
  update: SubscriptionPlanUpdate,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  if (update.displayName !== undefined) patch.display_name = update.displayName;
  if (update.description !== undefined) patch.description = update.description;
  if (update.monthlyPrice !== undefined) patch.monthly_price = update.monthlyPrice;
  if (update.monthlyPriceIsMinimum !== undefined) {
    patch.monthly_price_is_minimum = update.monthlyPriceIsMinimum;
  }
  if (update.bookingFeePercent !== undefined) {
    patch.booking_fee_percent = update.bookingFeePercent;
  }
  if (update.activityLimit !== undefined) patch.activity_limit = update.activityLimit;
  if (update.clubLimit !== undefined) patch.club_limit = update.clubLimit;
  if (update.supportLevel !== undefined) patch.support_level = update.supportLevel;
  if (update.dedicatedManager !== undefined) {
    patch.dedicated_manager = update.dedicatedManager;
  }
  if (update.quarterlyCallsEnabled !== undefined) {
    patch.quarterly_calls_enabled = update.quarterlyCallsEnabled;
  }
  if (update.earlyAccessEnabled !== undefined) {
    patch.early_access_enabled = update.earlyAccessEnabled;
  }
  if (update.unlimitedActivities !== undefined) {
    patch.unlimited_activities = update.unlimitedActivities;
  }
  if (update.unlimitedClubs !== undefined) patch.unlimited_clubs = update.unlimitedClubs;
  if (update.enabled !== undefined) patch.enabled = update.enabled;
  if (update.sortOrder !== undefined) patch.sort_order = update.sortOrder;
  if (update.responseTargetHours !== undefined) {
    patch.response_target_hours = update.responseTargetHours;
  }
  if (update.prioritySupport !== undefined) patch.priority_support = update.prioritySupport;
  if (update.urgentSupport !== undefined) patch.urgent_support = update.urgentSupport;
  if (update.features !== undefined) patch.features = update.features;
  if (update.cta !== undefined) patch.cta = update.cta;
  if (update.highlighted !== undefined) patch.highlighted = update.highlighted;
  if (update.contactSales !== undefined) patch.contact_sales = update.contactSales;

  return patch;
}

export function subscriptionPlanToPricingShape(plan: SubscriptionPlan) {
  return {
    id: plan.slug,
    legacyId: planSlugToLegacyId(plan.slug),
    slug: plan.slug,
    displayName: plan.displayName,
    monthlyPrice: plan.monthlyPrice,
    platformFeePercent: plan.bookingFeePercent,
    description: plan.description,
    features: plan.features,
    cta: plan.cta,
    highlighted: plan.highlighted,
    contactSales: plan.contactSales,
    monthlyPriceIsMinimum: plan.monthlyPriceIsMinimum,
  };
}

function planSlugToLegacyId(slug: PlanSlug): string {
  const map: Record<PlanSlug, string> = {
    FREE: "STARTER",
    PRO: "PRO",
    FRANCHISOR: "FRANCHISE",
    ENTERPRISE: "ENTERPRISE",
  };
  return map[slug];
}
