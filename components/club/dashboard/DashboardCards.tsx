import type { ReactNode } from "react";

const accentStyles = {
  teal: "from-teal-500/10 to-teal-500/5 text-teal-700 ring-teal-500/15",
  violet: "from-violet-500/10 to-violet-500/5 text-violet-700 ring-violet-500/15",
  amber: "from-amber-500/10 to-amber-500/5 text-amber-700 ring-amber-500/15",
  slate: "from-slate-500/10 to-slate-500/5 text-slate-700 ring-slate-500/15",
  rose: "from-rose-500/10 to-rose-500/5 text-rose-700 ring-rose-500/15",
} as const;

type DashboardStatCardProps = {
  label: string;
  value: string;
  hint: string;
  accent: keyof typeof accentStyles;
  growth?: {
    value: number;
    direction: "up" | "down" | "flat";
    label: string;
  };
};

export function DashboardStatCard({
  label,
  value,
  hint,
  accent,
  growth,
}: DashboardStatCardProps) {
  const growthClass =
    growth?.direction === "up"
      ? "text-emerald-700 bg-emerald-50"
      : growth?.direction === "down"
        ? "text-rose-700 bg-rose-50"
        : "text-slate-600 bg-slate-100";

  return (
    <article className="group rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`rounded-xl bg-gradient-to-br px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${accentStyles[accent]}`}
        >
          {label}
        </div>
        {growth && growth.direction !== "flat" ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${growthClass}`}
          >
            {growth.direction === "up" ? "+" : "-"}
            {growth.value}%
          </span>
        ) : null}
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900">
        {value}
      </p>
      <p className="mt-2 text-sm text-zinc-500">{hint}</p>
    </article>
  );
}

type DashboardSectionProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function DashboardSection({
  title,
  description,
  action,
  children,
  className = "",
}: DashboardSectionProps) {
  return (
    <section
      className={`rounded-2xl border border-zinc-200/80 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-zinc-500">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function DashboardPanelLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="text-sm font-medium text-teal-700 transition-colors hover:text-teal-800"
    >
      {children}
    </a>
  );
}
