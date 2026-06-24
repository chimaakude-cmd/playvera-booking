"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  formatMonthlyPrice,
  getPlanByIdOrDefault,
  getPlanLabel,
} from "@/src/config/pricing";
import { getProviderSubscription } from "@/lib/provider-subscription";
import { PricingDisclaimer } from "@/components/pricing/PricingDisclaimer";

type DashboardSubscriptionCardProps = {
  variant?: "default" | "new-club";
};

export function DashboardSubscriptionCard({
  variant = "default",
}: DashboardSubscriptionCardProps) {
  const [planLabel, setPlanLabel] = useState(getPlanLabel("STARTER"));
  const [monthlyPrice, setMonthlyPrice] = useState(
    formatMonthlyPrice(getPlanByIdOrDefault("STARTER")),
  );

  useEffect(() => {
    const subscription = getProviderSubscription();
    const plan = getPlanByIdOrDefault(subscription.planId);
    setPlanLabel(getPlanLabel(plan.id));
    setMonthlyPrice(formatMonthlyPrice(plan));
  }, []);

  if (variant === "new-club") {
    return (
      <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Your plan</p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-900">
              {planLabel}
            </h2>
            <p className="mt-1 text-sm text-zinc-600">{monthlyPrice}</p>
            <p className="mt-3 text-sm text-violet-700">
              Upgrade when your club is ready.
            </p>
            <PricingDisclaimer className="mt-2" />
          </div>
          <Link
            href="/club/settings/subscription"
            className="inline-flex shrink-0 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            View plans
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">Your subscription</p>
          <h2 className="mt-1 text-xl font-semibold text-[#0F172A]">{planLabel}</h2>
          <p className="mt-1 text-sm text-zinc-600">{monthlyPrice}</p>
          <PricingDisclaimer className="mt-2" />
        </div>
        <Link
          href="/club/settings/subscription"
          className="inline-flex shrink-0 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Manage plan
        </Link>
      </div>
    </section>
  );
}
