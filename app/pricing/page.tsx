import Link from "next/link";
import { getAllPlans } from "@/src/config/pricing";
import { HomeHeader } from "@/components/home/HomeHeader";
import { ACTIVORA_ACTION, ACTIVORA_PRIMARY } from "@/lib/home/constants";
import { PricingDisclaimer } from "@/components/pricing/PricingDisclaimer";
import { PricingPlanCard } from "@/components/pricing/PricingPlanCard";

export default function PricingPage() {
  const plans = getAllPlans();

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-[family-name:var(--font-inter)]">
      <HomeHeader />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2563EB]">
            Provider plans
          </p>
          <h1
            className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ color: ACTIVORA_PRIMARY }}
          >
            Simple pricing for clubs and franchises
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            Choose the plan that fits your club. Platform fees apply only when
            bookings are processed — no hidden charges on free plans.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <PricingPlanCard
              key={plan.id}
              plan={plan}
              ctaHref={
                plan.contactSales
                  ? "/contact?topic=enterprise"
                  : "/club/onboarding"
              }
            />
          ))}
        </div>

        <div className="mt-8 text-center">
          <PricingDisclaimer />
        </div>

        <section className="mx-auto mt-12 max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-[#0F172A]">
            Need help choosing a plan?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Start free on Starter and upgrade anytime from your dashboard. Franchise
            and Enterprise plans include dedicated onboarding support.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/get-started"
              className="inline-flex rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: ACTIVORA_ACTION }}
            >
              Get started free
            </Link>
            <Link
              href="/contact"
              className="inline-flex rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#0F172A] transition-colors hover:border-slate-300"
            >
              Talk to sales
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
