"use client";

import { useEffect, useState } from "react";
import {
  invalidateSubscriptionPlansCache,
  type PlanSlug,
  type SubscriptionPlan,
  type SubscriptionPlanUpdate,
} from "@/lib/subscription-plans";

async function fetchPlans(): Promise<SubscriptionPlan[]> {
  const response = await fetch("/api/admin/subscription-plans", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load plans.");
  }
  const data = (await response.json()) as { plans: SubscriptionPlan[] };
  return data.plans;
}

async function savePlan(slug: PlanSlug, update: SubscriptionPlanUpdate): Promise<SubscriptionPlan> {
  const response = await fetch("/api/admin/subscription-plans", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, update }),
  });
  if (!response.ok) {
    throw new Error("Save failed");
  }
  const data = (await response.json()) as { plan: SubscriptionPlan };
  return data.plan;
}

function PlanEditor({
  plan,
  onSaved,
}: {
  plan: SubscriptionPlan;
  onSaved: (plan: SubscriptionPlan) => void;
}) {
  const [draft, setDraft] = useState(plan);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(plan);
  }, [plan]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const saved = await savePlan(plan.slug, {
        displayName: draft.displayName,
        description: draft.description,
        monthlyPrice: draft.monthlyPrice,
        monthlyPriceIsMinimum: draft.monthlyPriceIsMinimum,
        bookingFeePercent: draft.bookingFeePercent,
        activityLimit: draft.unlimitedActivities ? null : draft.activityLimit,
        clubLimit: draft.unlimitedClubs ? null : draft.clubLimit,
        supportLevel: draft.supportLevel,
        dedicatedManager: draft.dedicatedManager,
        quarterlyCallsEnabled: draft.quarterlyCallsEnabled,
        earlyAccessEnabled: draft.earlyAccessEnabled,
        unlimitedActivities: draft.unlimitedActivities,
        unlimitedClubs: draft.unlimitedClubs,
        enabled: draft.enabled,
        responseTargetHours: draft.responseTargetHours,
        prioritySupport: draft.prioritySupport,
        urgentSupport: draft.urgentSupport,
        highlighted: draft.highlighted,
        contactSales: draft.contactSales,
      });
      invalidateSubscriptionPlansCache();
      onSaved(saved);
    } catch {
      setError("Unable to save plan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-zinc-900">{plan.displayName}</h3>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
          {plan.slug}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Monthly price (£)</span>
          <input
            type="number"
            step="0.01"
            value={draft.monthlyPrice}
            onChange={(e) =>
              setDraft((current) => ({
                ...current,
                monthlyPrice: Number(e.target.value),
              }))
            }
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Booking fee (%)</span>
          <input
            type="number"
            step="0.1"
            value={draft.bookingFeePercent}
            onChange={(e) =>
              setDraft((current) => ({
                ...current,
                bookingFeePercent: Number(e.target.value),
              }))
            }
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Activity limit</span>
          <input
            type="number"
            disabled={draft.unlimitedActivities}
            value={draft.activityLimit ?? ""}
            onChange={(e) =>
              setDraft((current) => ({
                ...current,
                activityLimit: e.target.value ? Number(e.target.value) : null,
              }))
            }
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm disabled:bg-zinc-50"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Club limit</span>
          <input
            type="number"
            disabled={draft.unlimitedClubs}
            value={draft.clubLimit ?? ""}
            onChange={(e) =>
              setDraft((current) => ({
                ...current,
                clubLimit: e.target.value ? Number(e.target.value) : null,
              }))
            }
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm disabled:bg-zinc-50"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Support level</span>
          <select
            value={draft.supportLevel}
            onChange={(e) =>
              setDraft((current) => ({
                ...current,
                supportLevel: e.target.value as SubscriptionPlan["supportLevel"],
              }))
            }
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          >
            <option value="standard">Standard</option>
            <option value="priority">Priority</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Response target (hours)</span>
          <input
            type="number"
            value={draft.responseTargetHours ?? ""}
            onChange={(e) =>
              setDraft((current) => ({
                ...current,
                responseTargetHours: e.target.value ? Number(e.target.value) : null,
              }))
            }
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {(
          [
            ["unlimitedActivities", "Unlimited activities"],
            ["unlimitedClubs", "Unlimited clubs"],
            ["quarterlyCallsEnabled", "Quarterly calls"],
            ["earlyAccessEnabled", "Early promotions / features"],
            ["prioritySupport", "Priority support"],
            ["urgentSupport", "Urgent support"],
            ["dedicatedManager", "Dedicated manager"],
            ["enabled", "Plan enabled"],
            ["monthlyPriceIsMinimum", "Price is minimum (e.g. £499+)"],
            ["highlighted", "Highlighted on pricing"],
            ["contactSales", "Contact sales CTA"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={draft[key]}
              onChange={(e) =>
                setDraft((current) => ({ ...current, [key]: e.target.checked }))
              }
              className="h-4 w-4 rounded border-zinc-300"
            />
            {label}
          </label>
        ))}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : `Save ${plan.displayName}`}
      </button>
    </form>
  );
}

export function SubscriptionPlansSection() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchPlans()
      .then(setPlans)
      .catch(() => setError("Unable to load subscription plans."))
      .finally(() => setLoading(false));
  }, []);

  function handleSaved(plan: SubscriptionPlan) {
    setPlans((current) =>
      current.map((item) => (item.slug === plan.slug ? plan : item)),
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Subscription plans</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Edit prices, booking fees, activity/club limits, and feature flags. All
          club-facing pages read from this configuration.
        </p>
      </div>

      {loading ? <p className="text-sm text-zinc-500">Loading plans…</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        {plans.map((plan) => (
          <PlanEditor key={plan.slug} plan={plan} onSaved={handleSaved} />
        ))}
      </div>
    </div>
  );
}
