"use client";

import { getAllPlans, type PlanId } from "@/src/config/pricing";
import { PricingDisclaimer } from "./PricingDisclaimer";
import { PricingPlanCard } from "./PricingPlanCard";

type PlanSelectorProps = {
  value: PlanId;
  onChange: (planId: PlanId) => void;
  showDisclaimer?: boolean;
  compact?: boolean;
};

export function PlanSelector({
  value,
  onChange,
  showDisclaimer = true,
  compact = false,
}: PlanSelectorProps) {
  const plans = getAllPlans();

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
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
