import { TRUST_STATS } from "@/lib/home/constants";

export function HomeTrustBar() {
  return (
    <section className="border-y border-slate-200/80 bg-white py-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-8 px-4 sm:gap-16 sm:px-6">
        {TRUST_STATS.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-xl font-extrabold tracking-tight text-[#0F172A] sm:text-2xl">
              {stat.value}
            </p>
            <p className="mt-0.5 text-sm font-medium text-slate-500">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
