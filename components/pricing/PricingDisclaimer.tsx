import { PRICING_DISCLAIMER } from "@/src/config/pricing";

type PricingDisclaimerProps = {
  className?: string;
};

export function PricingDisclaimer({ className = "" }: PricingDisclaimerProps) {
  return (
    <p className={`text-xs leading-relaxed text-slate-500 ${className}`.trim()}>
      {PRICING_DISCLAIMER}
    </p>
  );
}
