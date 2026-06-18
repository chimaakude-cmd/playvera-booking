"use client";

import { getAllPlans, type PlanId } from "@/src/config/pricing";
import { PricingDisclaimer } from "./PricingDisclaimer";
import { PricingPlanCard } from "./PricingPlanCard";

type PlanSelectorProps = {
  value: PlanId;
  onChange: (planId: PlanId) => void;
  showDisclaimer?: boolean;
  compact?: boolean;
  /** When set, only these plans are shown (e.g. paid upgrade options). */
  visiblePlanIds?: PlanId[];
};

export function PlanSelector({
  value,
  onChange,
  showDisclaimer = true,
  compact = false,
  visiblePlanIds,
}: PlanSelectorProps) {
  const plans = getAllPlans().filter((plan) =>
    visiblePlanIds ? visiblePlanIds.includes(plan.id) : true,
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <PricingPlanCard
            key={plan.id}
            plan={plan}
            selected={value === plan.id}
            onSelect={onChange}
            compact={compact}
          />
        ))}
      </div>
      {showDisclaimer ? <PricingDisclaimer /> : null}
    </div>
  );
}
