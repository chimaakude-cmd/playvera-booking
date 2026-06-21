import type {
  PlanCapabilities,
  PlanUsageContext,
  SubscriptionPlan,
} from "./types";

export function getPlanCapabilities(
  plan: SubscriptionPlan,
  usage: PlanUsageContext = {},
): PlanCapabilities {
  const activityCount = usage.activityCount ?? 0;
  const clubCount = usage.clubCount ?? 0;

  const activityLimit = plan.unlimitedActivities ? null : plan.activityLimit;
  const clubLimit = plan.unlimitedClubs ? null : plan.clubLimit;

  const canCreateActivity =
    plan.unlimitedActivities ||
    activityLimit == null ||
    activityCount < activityLimit;

  const canCreateClub =
    plan.unlimitedClubs || clubLimit == null || clubCount < clubLimit;

  return {
    canCreateActivity,
    canCreateClub,
    supportLevel: plan.supportLevel,
    activityLimit,
    clubLimit,
    bookingFee: plan.bookingFeePercent,
    featureFlags: {
      quarterlyCalls: plan.quarterlyCallsEnabled,
      earlyAccess: plan.earlyAccessEnabled,
      dedicatedManager: plan.dedicatedManager,
      prioritySupport: plan.prioritySupport,
      urgentSupport: plan.urgentSupport,
    },
    responseTargetHours: plan.responseTargetHours,
  };
}

export type PlanLimitReason = "activity_limit" | "club_limit" | null;

export function getPlanLimitReason(
  plan: SubscriptionPlan,
  usage: PlanUsageContext = {},
): PlanLimitReason {
  const capabilities = getPlanCapabilities(plan, usage);

  if (!capabilities.canCreateActivity) {
    return "activity_limit";
  }

  if (!capabilities.canCreateClub) {
    return "club_limit";
  }

  return null;
}

export function getSuggestedUpgradeSlug(
  reason: PlanLimitReason,
): "PRO" | "ENTERPRISE" | null {
  if (reason === "activity_limit") {
    return "PRO";
  }

  if (reason === "club_limit") {
    return "ENTERPRISE";
  }

  return null;
}
