import Link from "next/link";
import { Check } from "lucide-react";
import {
  formatMonthlyPrice,
  getPlanLabel,
  type PricingPlan,
} from "@/src/config/pricing";
import { ACTIVORA_ACTION, ACTIVORA_PRIMARY } from "@/lib/home/constants";

type PricingPlanCardProps = {
  plan: PricingPlan;
  selected?: boolean;
  onSelect?: (planId: PricingPlan["id"]) => void;
  ctaHref?: string;
  compact?: boolean;
};

export function PricingPlanCard({
  plan,
  selected = false,
  onSelect,
  ctaHref,
  compact = false,
}: PricingPlanCardProps) {
  const isInteractive = Boolean(onSelect);
  const highlighted = plan.highlighted || selected;

  const cardClassName = [
    "relative flex h-full min-w-0 flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all sm:p-6",
    highlighted
      ? "border-[#2563EB] ring-2 ring-[#2563EB]/20"
      : "border-slate-200 hover:border-slate-300",
    isInteractive ? "cursor-pointer hover:shadow-md" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {plan.highlighted ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#2563EB] px-3 py-1 text-xs font-semibold text-white">
          Most popular
        </span>
      ) : null}

      <div className="min-w-0">
        <h3
          className="text-lg font-bold tracking-tight"
          style={{ color: ACTIVORA_PRIMARY }}
        >
          {getPlanLabel(plan.id)}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {plan.description}
        </p>
      </div>

      <div className="mt-5 min-w-0">
        <p className="text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
          <span className="inline-block max-w-full break-words">
            {formatMonthlyPrice(plan)}
          </span>
        </p>
      </div>

      {!compact ? (
        <ul className="mt-6 flex-1 space-y-3">
          {plan.features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2.5 text-sm leading-snug text-slate-700"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                <Check className="h-3 w-3" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">{feature}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {!isInteractive ? (
        <div className="mt-6">
          {plan.contactSales ? (
            <Link
              href={ctaHref ?? "/contact?topic=enterprise"}
              className="inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: ACTIVORA_ACTION }}
            >
              {plan.cta}
            </Link>
          ) : (
            <Link
              href={ctaHref ?? "/club/onboarding"}
              className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                highlighted
                  ? "text-white hover:opacity-90"
                  : "border border-slate-200 bg-white text-[#0F172A] hover:border-slate-300"
              }`}
              style={highlighted ? { backgroundColor: ACTIVORA_ACTION } : undefined}
            >
              {plan.cta}
            </Link>
          )}
        </div>
      ) : null}
    </>
  );

  if (isInteractive) {
    return (
      <button
        type="button"
        onClick={() => onSelect?.(plan.id)}
        className={`${cardClassName} text-left`}
        aria-pressed={selected}
      >
        {content}
      </button>
    );
  }

  return <article className={cardClassName}>{content}</article>;
}
