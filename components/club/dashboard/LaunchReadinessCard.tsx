"use client";

import type { LaunchReadinessItem } from "@/lib/club/new-club-mode";

type LaunchReadinessCardProps = {
  items: LaunchReadinessItem[];
};

export function LaunchReadinessCard({ items }: LaunchReadinessCardProps) {
  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-zinc-900">Launch readiness</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Track what&apos;s done before parents can book.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={`rounded-xl border px-4 py-3 ${
              item.ready
                ? "border-emerald-200 bg-emerald-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  item.ready ? "bg-emerald-500" : "bg-amber-500"
                }`}
                aria-hidden
              />
              <p
                className={`text-sm font-semibold ${
                  item.ready ? "text-emerald-900" : "text-amber-900"
                }`}
              >
                {item.label}
              </p>
            </div>
            <p
              className={`mt-1 text-xs ${
                item.ready ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {item.ready ? "Complete" : "Still needed"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
