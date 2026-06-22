"use client";

import { SiteFooter } from "@/components/SiteFooter";
import { HomeHeader } from "@/components/home/HomeHeader";
import { LazySupportLauncher } from "@/components/support/LazySupportLauncher";
import { TransparencyHero } from "@/components/transparency/TransparencyHero";
import { PaymentFeeExample } from "@/components/trust/PaymentFeeExample";
import { TrustPaymentCTAs } from "@/components/trust/TrustPaymentCTAs";
import {
  GOCARDLESS_FEE_ESTIMATE,
  TRUST_FEE_DISCLAIMER,
  gocardlessTrustExample,
} from "@/constants/trust-payments";
import { PLATFORM_FEE_PERCENT } from "@/lib/payments";

export function GoCardlessPaymentsTrustPage() {
  return (
    <div className="flex min-h-full flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <HomeHeader />

      <main className="flex-1">
        <TransparencyHero
          eyebrow="Trust"
          title="GoCardless Payments"
          subtitle="How Direct Debit collections work on Activora — secure bank payments with recurring options for clubs and families."
        />

        <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="prose prose-zinc max-w-none space-y-6 text-base leading-7 text-zinc-700 dark:text-zinc-300">
            <section aria-labelledby="gc-how-it-works">
              <h2 id="gc-how-it-works" className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                How GoCardless works on Activora
              </h2>
              <p>
                GoCardless lets parents pay by Direct Debit from their bank account.
                It is especially useful for recurring subscriptions, term fees and
                regular activity payments where you want predictable collections
                without card expiry issues.
              </p>
              <p>
                Your club connects its own GoCardless account. When a parent pays,
                they authorise a Direct Debit mandate linked to your club — not to
                Activora. Activora orchestrates the booking flow; GoCardless handles
                the bank collection and payout to your connected account.
              </p>
            </section>

            <section aria-labelledby="gc-security">
              <h2 id="gc-security" className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Bank details and security
              </h2>
              <p>
                Activora does not store full bank account details on our servers.
                Mandate setup and account verification happen through GoCardless
                secure flows. Parents see clear Direct Debit guarantee information
                during authorisation.
              </p>
            </section>

            <section aria-labelledby="gc-fees">
              <h2 id="gc-fees" className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Platform and processing fees
              </h2>
              <p>
                Activora charges a {PLATFORM_FEE_PERCENT}% platform fee on the Free
                plan for successfully processed bookings. GoCardless processing
                fees are separate and set by GoCardless — they are not included in
                the Activora platform fee.
              </p>
              <p>{GOCARDLESS_FEE_ESTIMATE}</p>
              <p>
                Fees may vary by payment type, volume and your GoCardless pricing
                plan. International or failed collections may incur different
                charges.
              </p>
            </section>

            <PaymentFeeExample
              paymentMethod="GoCardless"
              {...gocardlessTrustExample}
            />

            <section aria-labelledby="gc-disclaimer">
              <h2 id="gc-disclaimer" className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
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
