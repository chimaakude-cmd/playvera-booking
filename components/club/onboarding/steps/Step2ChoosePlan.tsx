"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { ClubOnboardingState } from "@/lib/club-onboarding";
import { normalizePlanId, type PlanId } from "@/src/config/pricing";
import { PlanSelector } from "@/components/pricing/PlanSelector";
import { OnboardingStepIntro } from "../shared";

type StepProps = {
  state: ClubOnboardingState;
  onChange: (updates: Partial<ClubOnboardingState>) => void;
};

export function Step2ChoosePlan({ state, onChange }: StepProps) {
  const searchParams = useSearchParams();
  const queryPlan = searchParams.get("plan");

  useEffect(() => {
    if (!queryPlan) {
      return;
    }

    const normalized = normalizePlanId(queryPlan);
    if (normalized !== state.planId) {
      onChange({ planId: normalized });
    }
  }, [queryPlan, state.planId, onChange]);

  function handlePlanChange(planId: PlanId) {
    onChange({ planId });
  }

  return (
    <div className="space-y-6">
      <OnboardingStepIntro
        title="Choose your plan"
        description="Platform fees apply only when bookings are processed. Upgrade or downgrade anytime."
      />

      <PlanSelector value={state.planId} onChange={handlePlanChange} />
    </div>
  );
}
