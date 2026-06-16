import type { ReactNode } from "react";

type OrgStatusBadgeProps = {
  label: string;
  tone?: "emerald" | "amber" | "rose" | "violet" | "sky" | "zinc";
};

const toneStyles = {
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
  violet: "bg-violet-50 text-violet-700",
  sky: "bg-sky-50 text-sky-700",
  zinc: "bg-zinc-100 text-zinc-600",
} as const;

export function OrgStatusBadge({
  label,
  tone = "zinc",
}: OrgStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${toneStyles[tone]}`}
    >
      {label.replace(/_/g, " ")}
    </span>
  );
}

export function OrgActionLink({
  children,
  onClick,
  href,
  variant = "default",
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "danger" | "muted";
}) {
  const className =
    variant === "danger"
      ? "text-xs font-semibold text-red-700 hover:text-red-900"
      : variant === "muted"
        ? "text-xs font-semibold text-zinc-500 hover:text-zinc-700"
        : "text-xs font-semibold text-violet-700 hover:text-violet-900";

  if (href) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}

export function OrgFilterPanel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {children}
      </div>
    </div>
  );
}

export function OrgFilterField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={`block text-xs font-medium text-zinc-500 ${className ?? ""}`}
    >
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

export const orgSelectClass =
  "w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-800";

export const orgInputClass =
  "w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-800";

export function OrgTableWrapper({
  children,
  pagination,
}: {
  children: ReactNode;
  pagination?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">{children}</div>
      {pagination}
    </div>
  );
}

export function OrgTable({
  columns,
  children,
}: {
  columns: string[];
  children: ReactNode;
}) {
  return (
    <table className="min-w-full text-left text-sm">
      <thead className="border-b border-zinc-100 bg-zinc-50/80 text-xs uppercase tracking-wide text-zinc-500">
        <tr>
          {columns.map((column) => (
            <th key={column} className="px-4 py-3 font-semibold whitespace-nowrap">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100">{children}</tbody>
    </table>
  );
}

export function OrgToast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
      {message}
    </div>
  );
}
