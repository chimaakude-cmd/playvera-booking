import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { HomeHeader } from "@/components/home/HomeHeader";
import { LazySupportLauncher } from "@/components/support/LazySupportLauncher";
import { PricingDisclaimer } from "@/components/pricing/PricingDisclaimer";
import { COMMISSION_TIERS } from "@/constants/commission-tiers";
import { ACTIVORA_ACTION, ACTIVORA_PRIMARY } from "@/lib/home/constants";

export const PROVIDER_PRICING_PLANS = COMMISSION_TIERS.map((tier) => ({
  ...tier,
  highlighted: tier.plan === "Pro",
  cta:
    tier.plan === "Enterprise" || tier.plan === "Franchisor"
      ? "Contact sales"
      : tier.plan === "Pro"
        ? "Start Pro trial"
        : "Get started free",
  ctaHref:
    tier.plan === "Enterprise" || tier.plan === "Franchisor"
      ? "/contact?topic=enterprise"
      : tier.plan === "Pro"
        ? "/club/onboarding?plan=pro"
        : "/get-started",
}));

export function ProviderPricingPage() {
  return (
    <div className="flex min-h-full flex-col bg-[#F8FAFC] font-[family-name:var(--font-inter)] dark:bg-zinc-950">
      <HomeHeader />

      <main className="mx-auto max-w-6xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2563EB]">
            Provider plans
          </p>
          <h1
            className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl dark:text-zinc-50"
            style={{ color: ACTIVORA_PRIMARY }}
          >
            Transparent pricing for clubs and franchises
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg dark:text-zinc-400">
            Platform booking fees decrease as you grow. Payment processor fees from Stripe and
            GoCardless apply separately.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {PROVIDER_PRICING_PLANS.map((plan) => (
            <article
              key={plan.plan}
              className={`relative flex h-full flex-col rounded-2xl border bg-white p-5 shadow-sm sm:p-6 dark:bg-zinc-900 ${
                plan.highlighted
                  ? "border-[#2563EB] ring-2 ring-[#2563EB]/20"
                  : "border-slate-200 dark:border-zinc-700"
              }`}
            >
              {plan.highlighted ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#2563EB] px-3 py-1 text-xs font-semibold text-white">
                  Most popular
                </span>
              ) : null}
              <h2 className="text-lg font-bold" style={{ color: ACTIVORA_PRIMARY }}>
                {plan.plan}
              </h2>
              <p className="mt-1 text-2xl font-bold text-[#0F172A] dark:text-zinc-50">
                {plan.monthlyPrice}
                {plan.monthlyPrice.includes("mo") ? null : plan.monthlyPrice === "£0" ? (
                  <span className="ml-1 text-sm font-normal text-slate-500">/mo</span>
                ) : null}
              </p>
              <p className="mt-1 text-sm font-semibold text-teal-700 dark:text-teal-400">
                {plan.platformFeePercent}% platform fee
              </p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                {plan.description}
              </p>
              <Link
                href={plan.ctaHref}
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: ACTIVORA_ACTION }}
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-8 text-center">
          <PricingDisclaimer />
        </div>
      </main>

      <SiteFooter />
      <LazySupportLauncher />
    </div>
  );
}
