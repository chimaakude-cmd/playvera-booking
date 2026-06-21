import {
  getCachedSubscriptionPlanByLegacyId,
  getPlanCapabilities,
  getPlanLimitReason,
  getServerSubscriptionPlanBySlug,
  legacyIdToPlanSlug,
  type PlanLimitReason,
} from "@/lib/subscription-plans";

export class PlanLimitError extends Error {
  constructor(
    message: string,
    readonly reason: PlanLimitReason,
  ) {
    super(message);
    this.name = "PlanLimitError";
  }
}

export async function assertCanCreateActivity(options: {
  planRef: string | null | undefined;
  activityCount: number;
}): Promise<void> {
  const plan = await getServerSubscriptionPlanBySlug(
    legacyIdToPlanSlug(options.planRef),
  );
  const capabilities = getPlanCapabilities(plan, {
    activityCount: options.activityCount,
  });

  if (!capabilities.canCreateActivity) {
    throw new PlanLimitError(
      `Activity limit reached (${capabilities.activityLimit} on ${plan.displayName}). Upgrade to Pro for unlimited activities.`,
      "activity_limit",
    );
  }
}

export async function assertCanCreateClub(options: {
  planRef: string | null | undefined;
  clubCount: number;
}): Promise<void> {
  const plan = await getServerSubscriptionPlanBySlug(
    legacyIdToPlanSlug(options.planRef),
  );
  const capabilities = getPlanCapabilities(plan, {
    clubCount: options.clubCount,
  });

  if (!capabilities.canCreateClub) {
    throw new PlanLimitError(
      `Club limit reached (${capabilities.clubLimit} on ${plan.displayName}). Upgrade to Enterprise for unlimited clubs.`,
      "club_limit",
    );
  }
}

export function checkCanCreateActivitySync(
  planRef: string | null | undefined,
  activityCount: number,
): { allowed: boolean; reason: PlanLimitReason } {
  const plan = getCachedSubscriptionPlanByLegacyId(planRef);
  const reason = getPlanLimitReason(plan, { activityCount });
  return {
    allowed: reason !== "activity_limit",
    reason: reason === "activity_limit" ? "activity_limit" : null,
  };
}
