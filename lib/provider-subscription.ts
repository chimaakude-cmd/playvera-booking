import {
  DEFAULT_PLAN_ID,
  getPlanByIdOrDefault,
  normalizePlanId,
  type PlanId,
} from "@/src/config/pricing";

export const PROVIDER_SUBSCRIPTION_STORAGE_KEY = "activora-provider-subscription";

export type ProviderSubscriptionState = {
  planId: PlanId;
  selectedAt: string | null;
};

function createDefaultSubscriptionState(): ProviderSubscriptionState {
  return {
    planId: DEFAULT_PLAN_ID,
    selectedAt: null,
  };
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readLegacyClubTeamPlan(): PlanId | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = localStorage.getItem("activora-club-team");
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as { subscriptionPlan?: string };
    if (!parsed.subscriptionPlan) {
      return null;
    }

    return normalizePlanId(parsed.subscriptionPlan);
  } catch {
    return null;
  }
}

function syncLegacyStores(planId: PlanId): void {
  if (!isBrowser()) {
    return;
  }

  try {
    const feeRaw = localStorage.getItem("activora-fee-settings");
    const plan = getPlanByIdOrDefault(planId);
    const feeSettings = feeRaw
      ? ({ ...JSON.parse(feeRaw), platformFeePercent: plan.platformFeePercent } as {
          platformFeePercent: number;
        })
      : { platformFeePercent: plan.platformFeePercent };

    localStorage.setItem(
      "activora-fee-settings",
      JSON.stringify({
        feeHandling: "provider_absorbs",
        ...feeSettings,
        platformFeePercent: plan.platformFeePercent,
      }),
    );
  } catch {
    // Ignore fee-settings sync failures — plan storage remains source of truth.
  }

  try {
    const teamRaw = localStorage.getItem("activora-club-team");
    if (!teamRaw) {
      return;
    }

    const teamState = JSON.parse(teamRaw) as Record<string, unknown>;
    localStorage.setItem(
      "activora-club-team",
      JSON.stringify({
        ...teamState,
        subscriptionPlan: planId.toLowerCase(),
      }),
    );
  } catch {
    // Ignore club-team sync failures.
  }
}

export function getProviderSubscription(): ProviderSubscriptionState {
  if (!isBrowser()) {
    return createDefaultSubscriptionState();
  }

  try {
    const raw = localStorage.getItem(PROVIDER_SUBSCRIPTION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ProviderSubscriptionState>;
      return {
        planId: normalizePlanId(parsed.planId),
        selectedAt: parsed.selectedAt ?? null,
      };
    }
  } catch {
    // Fall through to legacy migration.
  }

  const legacyPlan = readLegacyClubTeamPlan();
  if (legacyPlan) {
    const migrated: ProviderSubscriptionState = {
      planId: legacyPlan,
      selectedAt: null,
    };
    saveProviderSubscription(migrated, { syncLegacy: false });
    return migrated;
  }

  return createDefaultSubscriptionState();
}

export function saveProviderSubscription(
  state: ProviderSubscriptionState,
  options: { syncLegacy?: boolean } = {},
): void {
  if (!isBrowser()) {
    return;
  }

  const normalized: ProviderSubscriptionState = {
    planId: normalizePlanId(state.planId),
    selectedAt: state.selectedAt,
  };

  localStorage.setItem(PROVIDER_SUBSCRIPTION_STORAGE_KEY, JSON.stringify(normalized));

  if (options.syncLegacy !== false) {
    syncLegacyStores(normalized.planId);
  }
}

export function setProviderSubscriptionPlan(planId: PlanId): ProviderSubscriptionState {
  const next: ProviderSubscriptionState = {
    planId: normalizePlanId(planId),
    selectedAt: new Date().toISOString(),
  };

  saveProviderSubscription(next);
  return next;
}

export function getProviderPlatformFeePercent(): number {
  const { planId } = getProviderSubscription();
  return getPlanByIdOrDefault(planId).platformFeePercent;
}

export function getProviderPlanId(): PlanId {
  return getProviderSubscription().planId;
}
