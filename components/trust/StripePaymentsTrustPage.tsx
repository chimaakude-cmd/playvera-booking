"use client";

import { SiteFooter } from "@/components/SiteFooter";
import { HomeHeader } from "@/components/home/HomeHeader";
import { LazySupportLauncher } from "@/components/support/LazySupportLauncher";
import { TransparencyHero } from "@/components/transparency/TransparencyHero";
import { PaymentFeeExample } from "@/components/trust/PaymentFeeExample";
import { TrustPaymentCTAs } from "@/components/trust/TrustPaymentCTAs";
import { CommissionTierTable } from "@/components/trust/CommissionTierTable";
import {
  STRIPE_UK_FEE_ESTIMATES,
  TRUST_FEE_DISCLAIMER,
  stripeTrustExample,
} from "@/constants/trust-payments";

export function StripePaymentsTrustPage() {
  return (
    <div className="flex min-h-full flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <HomeHeader />

      <main className="flex-1">
        <TransparencyHero
          eyebrow="Trust"
          title="Stripe Payments"
          subtitle="How card payments work on Activora — secure checkout for parents with payouts to your club's own Stripe account."
        />

        <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="prose prose-zinc max-w-none space-y-6 text-base leading-7 text-zinc-700 dark:text-zinc-300">
            <section aria-labelledby="stripe-connect">
              <h2 id="stripe-connect" className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Stripe Connect for clubs
              </h2>
              <p>
                Activora uses Stripe Connect so your club or activity provider
                connects its own Stripe account. Payouts go directly to your bank
                account — Activora does not hold your card revenue.
              </p>
              <p>
                When you connect Stripe, you complete Stripe&apos;s verification
                and payout setup. Once enabled, parents can pay by card at checkout
                and funds are split according to your plan and fee settings.
              </p>
            </section>

            <section aria-labelledby="stripe-parent-payments">
              <h2 id="stripe-parent-payments" className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Parent payments and card security
              </h2>
              <p>
                Parents pay through Stripe at checkout. Activora does not store
                full card numbers on our servers — card details are handled by
                Stripe&apos;s secure payment flows.
              </p>
            </section>

            <section aria-labelledby="stripe-fees">
              <h2 id="stripe-fees" className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Platform and processing fees
              </h2>
              <p>
                Activora charges a platform booking fee on successfully processed
                payments. The fee depends on your subscription plan — lower tiers
                on Pro, Franchisor and Enterprise. Stripe processing fees are
                separate and set by Stripe; they are not included in the Activora
                platform fee.
              </p>
              <div className="my-4">
                <CommissionTierTable />
              </div>
              <p>
                UK fee estimates (may vary — check Stripe for current rates):
              </p>
              <ul className="list-disc space-y-2 pl-5">
                {STRIPE_UK_FEE_ESTIMATES.map((item) => (
                  <li key={item.label}>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {item.label}:
                    </span>{" "}
                    {item.rate}
                  </li>
                ))}
              </ul>
            </section>

            <PaymentFeeExample
              paymentMethod="Stripe"
              {...stripeTrustExample}
            />

            <section aria-labelledby="stripe-disclaimer">
              <h2 id="stripe-disclaimer" className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Important note on fees
              </h2>
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                {TRUST_FEE_DISCLAIMER}
              </p>
            </section>
          </div>

          <TrustPaymentCTAs />
        </article>
      </main>

      <SiteFooter />
      <LazySupportLauncher />
    </div>
  );
}
