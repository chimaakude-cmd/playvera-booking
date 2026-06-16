import { DISCOVERY_TRUST_STATS } from "@/lib/discovery/constants";

export function SessionsTrustBar() {
  return (
    <section className="border-b border-slate-200/70 bg-white py-4">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-6 px-4 sm:gap-10 sm:px-6">
        {DISCOVERY_TRUST_STATS.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-base font-extrabold tracking-tight text-[#0F172A] sm:text-lg">
              {stat.value}
            </p>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
