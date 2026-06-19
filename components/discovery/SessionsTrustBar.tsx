import { BadgeCheck, ShieldCheck, Zap } from "lucide-react";
import { DISCOVERY_TRUST_SIGNALS } from "@/lib/discovery/constants";

const TRUST_ICONS = {
  verified: BadgeCheck,
  instant: Zap,
  secure: ShieldCheck,
} as const;

export function SessionsTrustBar() {
  return (
    <section className="border-t border-orange-100/60 bg-[#FFFBF7] py-6 sm:py-8">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-8 px-4 sm:gap-12 sm:px-6">
        {DISCOVERY_TRUST_SIGNALS.map((signal) => {
          const Icon = TRUST_ICONS[signal.icon];
          return (
            <div
              key={signal.label}
              className="flex items-center gap-2.5 text-center sm:gap-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-[#F87128]">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <p className="text-sm font-semibold text-[#0F172A]">
                {signal.label}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
