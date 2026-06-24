"use client";

import { useMemo, useState } from "react";
import { VatBreakdownPanel } from "@/components/club/finance/VatBreakdownPanel";
import { PaymentFeeExample } from "@/components/trust/PaymentFeeExample";
import { calculateVatBreakdown } from "@/lib/club-finance/vat";
import { getFeeSettings } from "@/lib/fee-settings";
import { calculatePaymentBreakdown, formatMoney } from "@/lib/payments";
import {
  formatBillingStartLabel,
  resolveSessionSubscription,
  sessionHasSubscriptionBilling,
} from "@/lib/session-subscriptions/types";
import type { ClubSession } from "@/lib/sessions";
import type { BookingDetailsForm } from "@/lib/booking-flow/types";
import type { BookingQuestionConfig } from "@/lib/booking-questions";

type BookingCheckoutStepProps = {
  session: ClubSession;
  details: BookingDetailsForm;
  sessionQuestions: BookingQuestionConfig[];
  questionValues: Record<string, string | boolean>;
  accessMode: "guest" | "parent";
  onBack: () => void;
};

export function BookingCheckoutStep({
  session,
  details,
  sessionQuestions,
  questionValues,
  accessMode,
  onBack,
}: BookingCheckoutStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subscription = useMemo(
    () => resolveSessionSubscription(session),
    [session],
  );
  const isSubscription = sessionHasSubscriptionBilling(session);

  const listPrice = subscription?.monthlyPrice ?? session.price;
  const feeSettings = getFeeSettings();
  const vatBreakdown = calculateVatBreakdown(listPrice);
  const payment = calculatePaymentBreakdown(
    vatBreakdown.grossAmount,
    session.platformFeePercent,
    feeSettings.feeHandling,
  );

  async function handleCheckout() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/stripe/checkout/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session: {
            id: session.id,
            sessionTitle: session.sessionTitle,
            location: session.location,
            day: session.day,
            startTime: session.startTime,
            endTime: session.endTime,
            price: listPrice,
            platformFeePercent: session.platformFeePercent,
            providerStripeAccountId: session.providerStripeAccountId,
            bookingStructure: session.bookingStructure,
            subscriptionEnabled: session.subscriptionEnabled,
            tickets: session.tickets,
            schedule: session.schedule,
            stripeProductId: session.stripeProductId,
            stripePriceId: session.stripePriceId,
          },
          ticketId: subscription?.ticketId ?? undefined,
          details,
          sessionQuestions,
          questionValues,
          accessMode,
          feeHandling: feeSettings.feeHandling,
        }),
      });

      const data = (await response.json()) as {
        checkoutUrl?: string;
        mock?: boolean;
        pendingBookingId?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not start checkout.");
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.mock && data.pendingBookingId) {
        const completeResponse = await fetch(
          "/api/stripe/checkout/booking/complete",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pendingBookingId: data.pendingBookingId,
              mock: true,
            }),
          },
        );
        const completeData = (await completeResponse.json()) as {
          payload?: import("@/lib/booking-checkout/server-store").PendingBookingPayload;
          error?: string;
        };
        if (!completeResponse.ok || !completeData.payload) {
          throw new Error(completeData.error ?? "Payment confirmation failed.");
        }

        const { finalizeBookingOnClient } = await import(
          "@/lib/booking-checkout/finalize"
        );
        const booking = finalizeBookingOnClient(completeData.payload);
        const query = new URLSearchParams({
          sessionName: session.sessionTitle,
          childName: booking.childName,
          price: String(listPrice),
          status: "confirmed",
          bookingId: booking.id,
          checkout: "success",
        });
        window.location.href = `/book/confirmation?${query.toString()}`;
        return;
      }

      throw new Error("Checkout could not be started.");
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Checkout failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#0F172A]">
          {isSubscription ? "Subscribe" : "Checkout"}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {isSubscription
            ? "Review your subscription and pay securely with Stripe."
            : "Review your booking and pay securely with Stripe."}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Session</dt>
            <dd className="font-semibold text-[#0F172A]">{session.sessionTitle}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Child</dt>
            <dd className="font-semibold text-[#0F172A]">{details.childName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Parent</dt>
            <dd className="font-semibold text-[#0F172A]">{details.parentName}</dd>
          </div>

          {isSubscription && subscription ? (
            <>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Monthly price</dt>
                <dd className="font-semibold text-[#0F172A]">
                  {formatMoney(subscription.monthlyPrice)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Billing starts</dt>
                <dd className="font-semibold text-[#0F172A]">
                  {formatBillingStartLabel(subscription)}
                </dd>
              </div>
              {subscription.billingDay ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Billing day</dt>
                  <dd className="font-semibold text-[#0F172A]">
                    {subscription.billingDay}
                  </dd>
                </div>
              ) : null}
              {subscription.trialDays ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Trial period</dt>
                  <dd className="font-semibold text-[#0F172A]">
                    {subscription.trialDays} days
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Cancel anytime</dt>
                <dd className="font-semibold text-[#0F172A]">
                  {subscription.cancelAnytime ? "Yes" : "No"}
                </dd>
              </div>
              {subscription.minimumCommitmentMonths ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Minimum commitment</dt>
                  <dd className="font-semibold text-[#0F172A]">
                    {subscription.minimumCommitmentMonths} months
                  </dd>
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex justify-between gap-4 border-t border-slate-200 pt-3">
              <dt className="font-medium text-slate-700">Total</dt>
              <dd className="text-lg font-bold text-[#0F172A]">
                {formatMoney(payment.customerPrice)}
              </dd>
            </div>
          )}
        </dl>

        {isSubscription ? (
          <p className="mt-4 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-900">
            Parents pay automatically each month until cancelled.
          </p>
        ) : (
          <div className="mt-4">
            <VatBreakdownPanel breakdown={vatBreakdown} compact />
          </div>
        )}

        <div className="mt-4">
          <PaymentFeeExample
            compact
            paymentMethod="Stripe"
            bookingAmount={payment.listPrice}
            activoraFeePercent={payment.platformFeePercent}
            estimatedProcessorFeeLabel="Estimated Stripe processing fee"
            estimatedProcessorFeeAmount={payment.estimatedStripeFee}
            providerReceivesLabel="Estimated provider receives"
          />
        </div>
      </div>

      <p className="text-xs text-slate-500">
        {isSubscription
          ? "Your subscription activates after successful checkout. Platform fee is 2.5% standard unless your club plan specifies otherwise."
          : "Your booking is only confirmed after successful payment. Platform and processor fees shown above are estimates and may vary."}
      </p>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => void handleCheckout()}
          disabled={loading}
          className="rounded-xl bg-[#2563EB] px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading
            ? "Redirecting…"
            : isSubscription
              ? "Subscribe with Stripe"
              : "Pay with Stripe"}
        </button>
      </div>
    </div>
  );
}
