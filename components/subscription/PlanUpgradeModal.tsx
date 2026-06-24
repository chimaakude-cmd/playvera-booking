"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TRUST_PLATFORM_FEE_NOTE } from "@/constants/trust-payments";
import {
  getPlanCapabilities,
  getPlanLimitReason,
  getSuggestedUpgradeSlug,
  getCachedSubscriptionPlanByLegacyId,
  getCachedSubscriptionPlans,
  hydrateSubscriptionPlans,
  formatPlanMonthlyPrice,
  type PlanLimitReason,
  type PlanCapabilities,
  type SubscriptionPlan,
} from "@/lib/subscription-plans";
import { getProviderPlanId } from "@/lib/provider-subscription";
import { getPlanLabel } from "@/src/config/pricing";

export type PlanUpgradeModalProps = {
  open: boolean;
  reason: PlanLimitReason;
  onClose: () => void;
  currentCount?: number;
  limit?: number | null;
};

export function PlanUpgradeModal({
  open,
  reason,
  onClose,
  currentCount,
  limit,
}: PlanUpgradeModalProps) {
  const [targetPlan, setTargetPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    if (!open || !reason) {
      return;
    }

    void hydrateSubscriptionPlans().then(() => {
      const slug = getSuggestedUpgradeSlug(reason);
      if (!slug) {
        return;
      }
      const match = getCachedSubscriptionPlans().find((plan) => plan.slug === slug);
      setTargetPlan(match ?? null);
    });
  }, [open, reason]);

  if (!open || !reason) {
    return null;
  }

  const title =
    reason === "activity_limit"
      ? "Activity limit reached"
      : "Club limit reached";

  const description =
    reason === "activity_limit"
      ? `Your Free plan includes up to ${limit ?? 20} activities. Upgrade to Pro for unlimited activities, priority support, and early feature access.`
      : `Your Franchisor plan includes up to ${limit ?? 25} managed clubs. Upgrade to Enterprise for unlimited clubs and dedicated account management.`;

  const upgradeLabel = targetPlan
    ? `${targetPlan.displayName} — ${formatPlanMonthlyPrice(targetPlan)}`
    : reason === "activity_limit"
      ? "Pro"
      : "Enterprise";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-upgrade-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="plan-upgrade-title" className="text-lg font-semibold text-zinc-900">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">{description}</p>
        {currentCount != null && limit != null ? (
          <p className="mt-3 rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            Current usage: {currentCount} of {limit}
          </p>
        ) : null}
        <p className="mt-3 text-xs text-zinc-500">{TRUST_PLATFORM_FEE_NOTE}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/club/settings/subscription"
            className="inline-flex rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Upgrade to {upgradeLabel}
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

export function usePlanCapabilities(usage: {
  activityCount?: number;
  clubCount?: number;
} = {}): {
  plan: SubscriptionPlan;
  capabilities: PlanCapabilities;
  limitReason: PlanLimitReason;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<SubscriptionPlan>(() =>
    getCachedSubscriptionPlanByLegacyId(getProviderPlanId()),
  );

  const refresh = useCallback(async () => {
    await hydrateSubscriptionPlans();
    setPlan(getCachedSubscriptionPlanByLegacyId(getProviderPlanId()));
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const capabilities = useMemo(
    () => getPlanCapabilities(plan, usage),
    [plan, usage.activityCount, usage.clubCount],
  );

  const limitReason = useMemo(
    () => getPlanLimitReason(plan, usage),
    [plan, usage.activityCount, usage.clubCount],
  );

  return { plan, capabilities, limitReason, loading, refresh };
}

export function useActivityCreationGate(activityCount: number) {
  const { capabilities, limitReason, plan } = usePlanCapabilities({ activityCount });

  return {
    allowed: capabilities.canCreateActivity,
    reason: limitReason,
    activityLimit: capabilities.activityLimit,
    planLabel: getPlanLabel(plan.slug === "FREE" ? "STARTER" : plan.slug),
  };
}
