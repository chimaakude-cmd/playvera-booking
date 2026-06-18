"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, CreditCard, Loader2 } from "lucide-react";
import {
  formatMonthlyPrice,
  formatPlatformFee,
  getAllPlans,
  getPlanByIdOrDefault,
  getPlanLabel,
  planRequiresGoCardlessBilling,
  type PlanId,
} from "@/src/config/pricing";
import { PlanSelector } from "@/components/pricing/PlanSelector";
import { PricingDisclaimer } from "@/components/pricing/PricingDisclaimer";
import { getClubProfile } from "@/lib/club-profile";
import {
  cancelProviderSubscriptionBilling,
  completeProviderSubscriptionSetup,
  refreshProviderSubscriptionStatus,
  startProviderSubscriptionSetup,
} from "@/lib/provider-subscriptions/actions";
import {
  getProviderSubscriptionRecord,
  PROVIDER_SUBSCRIPTION_STATUS_LABELS,
} from "@/lib/provider-subscriptions";
import {
  getProviderSubscription,
  setProviderSubscriptionPlan,
} from "@/lib/provider-subscription";
import { ACTIVORA_ACTION } from "@/lib/home/constants";

function formatBillingDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function SubscriptionManagementSection() {
  const searchParams = useSearchParams();
  const [currentPlanId, setCurrentPlanId] = useState<PlanId>("STARTER");
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>("STARTER");
  const [billingStatus, setBillingStatus] = useState(
    PROVIDER_SUBSCRIPTION_STATUS_LABELS.none,
  );
  const [nextBillingDate, setNextBillingDate] = useState<string | null>(null);
  const [hasActiveBilling, setHasActiveBilling] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [billingEmail, setBillingEmail] = useState("");

  const loadState = useCallback(async () => {
    const subscription = getProviderSubscription();
    const billing = await refreshProviderSubscriptionStatus();
    setCurrentPlanId(subscription.planId);
    setSelectedPlanId(subscription.planId);
    setBillingStatus(PROVIDER_SUBSCRIPTION_STATUS_LABELS[billing.status]);
    setNextBillingDate(billing.nextBillingDate);
    setHasActiveBilling(
      billing.status === "active" || billing.status === "pending_mandate",
    );

    try {
      const profile = getClubProfile();
      setBillingEmail(profile.contact.email || "");
    } catch {
      setBillingEmail("");
    }
  }, []);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  useEffect(() => {
    const gcComplete = searchParams.get("gocardless");
    const redirectFlowId = searchParams.get("redirect_flow_id");
    const sessionToken = searchParams.get("session_token");
    const providerId = searchParams.get("providerId") ?? undefined;

    if (gcComplete !== "complete" || !redirectFlowId || !sessionToken) {
      return;
    }

    const flowId = redirectFlowId;
    const token = sessionToken;
    let cancelled = false;

    async function finishRedirect() {
      setBusy(true);
      setErrorMessage(null);

      try {
        await completeProviderSubscriptionSetup({
          providerId,
          redirectFlowId: flowId,
          sessionToken: token,
        });
        if (!cancelled) {
          setSavedMessage("Direct Debit set up — your subscription is now active.");
          await loadState();
          const url = new URL(window.location.href);
          url.searchParams.delete("gocardless");
          url.searchParams.delete("redirect_flow_id");
          url.searchParams.delete("session_token");
          url.searchParams.delete("mock_gocardless");
          url.searchParams.delete("providerId");
          window.history.replaceState({}, "", url.toString());
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Could not complete Direct Debit setup.",
          );
        }
      } finally {
        if (!cancelled) {
          setBusy(false);
        }
      }
    }

    void finishRedirect();

    return () => {
      cancelled = true;
    };
  }, [searchParams, loadState]);

  const currentPlan = useMemo(
    () => getPlanByIdOrDefault(currentPlanId),
    [currentPlanId],
  );

  const selectedPlan = useMemo(
    () => getPlanByIdOrDefault(selectedPlanId),
    [selectedPlanId],
  );

  const upgradePlans = useMemo(() => {
    const order = getAllPlans().map((plan) => plan.id);
    const currentIndex = order.indexOf(currentPlanId);
    return order.slice(currentIndex + 1);
  }, [currentPlanId]);

  useEffect(() => {
    if (upgradePlans.length > 0 && !upgradePlans.includes(selectedPlanId)) {
      setSelectedPlanId(upgradePlans[0]);
    }
  }, [upgradePlans, selectedPlanId]);

  const showBillingDetails = planRequiresGoCardlessBilling(currentPlanId);
  const selectedRequiresBilling = planRequiresGoCardlessBilling(selectedPlanId);

  async function handleSavePlan() {
    setSavedMessage(null);
    setErrorMessage(null);

    if (selectedPlan.contactSales) {
      window.location.href = "/contact?topic=enterprise";
      return;
    }

    if (selectedPlanId === currentPlanId) {
      return;
    }

    if (selectedRequiresBilling) {
      if (!billingEmail.trim()) {
        setErrorMessage("Add a billing email in your club profile before upgrading.");
        return;
      }

      setBusy(true);
      try {
        const setup = await startProviderSubscriptionSetup({
          planId: selectedPlanId,
          email: billingEmail.trim(),
          companyName: getClubProfile().clubName,
        });
        window.location.href = setup.redirectUrl;
        return;
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not start Direct Debit setup.",
        );
        setBusy(false);
        return;
      }
    }

    const next = setProviderSubscriptionPlan(selectedPlanId);
    setCurrentPlanId(next.planId);
    setSavedMessage(`Your plan is now ${getPlanLabel(next.planId)}.`);
  }

  async function handleCancelSubscription() {
    const billing = getProviderSubscriptionRecord();
    if (billing.status !== "active" && billing.status !== "payment_failed") {
      return;
    }

    if (
      !window.confirm(
        "Cancel your paid subscription? You will be moved to the free Starter plan at the end of the current billing period.",
      )
    ) {
      return;
    }

    setBusy(true);
    setSavedMessage(null);
    setErrorMessage(null);

    try {
      await cancelProviderSubscriptionBilling();
      setSavedMessage("Subscription cancelled — you are now on the Starter plan.");
      await loadState();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not cancel subscription.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Current plan</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0F172A]">
              {getPlanLabel(currentPlan.id)}
            </h2>
            <p className="mt-2 text-sm text-zinc-600">{currentPlan.description}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-right">
            <p className="text-lg font-semibold text-[#0F172A]">
              {formatMonthlyPrice(currentPlan)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {formatPlatformFee(currentPlan)} platform fee
            </p>
          </div>
        </div>

        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {currentPlan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-zinc-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden />
              {feature}
            </li>
          ))}
        </ul>

        <PricingDisclaimer className="mt-4" />
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700">
            <CreditCard className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-[#0F172A]">Billing</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Provider subscriptions are billed via GoCardless Direct Debit. Parent
              booking payments continue to use Stripe.
            </p>
          </div>
        </div>

        <dl className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Payment method
            </dt>
            <dd className="mt-1 text-sm font-semibold text-zinc-900">
              {currentPlan.contactSales
                ? "Manual invoice / contact sales"
                : showBillingDetails
                  ? "Direct Debit via GoCardless"
                  : "None — free plan"}
            </dd>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Billing status
            </dt>
            <dd className="mt-1 text-sm font-semibold text-zinc-900">{billingStatus}</dd>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Next collection
            </dt>
            <dd className="mt-1 text-sm font-semibold text-zinc-900">
              {showBillingDetails && hasActiveBilling
                ? formatBillingDate(nextBillingDate)
                : "—"}
            </dd>
          </div>
        </dl>

        {currentPlan.contactSales ? (
          <p className="mt-4 text-sm text-zinc-600">
            Enterprise plans are invoiced manually. Contact our sales team for custom
            pricing and onboarding.
          </p>
        ) : null}

        {!currentPlan.contactSales && currentPlanId === "STARTER" ? (
          <p className="mt-4 text-sm text-zinc-600">
            Starter is free — no Direct Debit setup required. Upgrade to Pro or Franchise
            to start monthly billing.
          </p>
        ) : null}

        {hasActiveBilling && showBillingDetails ? (
          <button
            type="button"
            onClick={() => void handleCancelSubscription()}
            disabled={busy}
            className="mt-5 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel subscription
          </button>
        ) : null}
      </section>

      {upgradePlans.length > 0 ? (
        <section className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-[#0F172A]">Upgrade plan</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Select a higher plan to unlock more features and lower platform fees.
              Pro and Franchise require Direct Debit setup via GoCardless.
            </p>
          </div>

          <PlanSelector
            value={selectedPlanId}
            onChange={setSelectedPlanId}
            visiblePlanIds={upgradePlans}
          />

          {selectedRequiresBilling ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <label htmlFor="billing-email" className="text-sm font-medium text-zinc-700">
                Billing email
              </label>
              <input
                id="billing-email"
                type="email"
                value={billingEmail}
                onChange={(event) => setBillingEmail(event.target.value)}
                placeholder="accounts@yourclub.co.uk"
                className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
              />
            </div>
          ) : null}

          {savedMessage ? (
            <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
              {savedMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => void handleSavePlan()}
              disabled={selectedPlanId === currentPlanId || busy}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ backgroundColor: ACTIVORA_ACTION }}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {selectedPlan.contactSales
                ? "Contact sales for Enterprise"
                : selectedPlanId === currentPlanId
                  ? "Current plan selected"
                  : selectedRequiresBilling
                    ? `Set up Direct Debit for ${getPlanLabel(selectedPlanId)}`
                    : `Switch to ${getPlanLabel(selectedPlanId)}`}
            </button>
            <Link
              href="/pricing"
              className="text-sm font-semibold text-[#2563EB] hover:underline"
            >
              Compare all plans
            </Link>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-600">
            You&apos;re on our highest self-serve plan. For Enterprise custom pricing,
            contact our sales team.
          </p>
          <Link
            href="/contact?topic=enterprise"
            className="mt-3 inline-flex text-sm font-semibold text-[#2563EB] hover:underline"
          >
            Contact sales
          </Link>
        </section>
      )}
    </div>
  );
}
