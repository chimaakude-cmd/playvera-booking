import type { ReactNode } from "react";
import { formatMoney } from "@/lib/payments";
import type {
  FailedPaymentRetryStatus,
  PaymentStatus,
  PayoutStatus,
  RefundStatus,
} from "@/lib/club-finance/types";

const accentStyles = {
  teal: "from-teal-500/10 to-teal-500/5 text-teal-700 ring-teal-500/15",
  violet: "from-violet-500/10 to-violet-500/5 text-violet-700 ring-violet-500/15",
  amber: "from-amber-500/10 to-amber-500/5 text-amber-700 ring-amber-500/15",
  slate: "from-slate-500/10 to-slate-500/5 text-slate-700 ring-slate-500/15",
  rose: "from-rose-500/10 to-rose-500/5 text-rose-700 ring-rose-500/15",
  emerald: "from-emerald-500/10 to-emerald-500/5 text-emerald-700 ring-emerald-500/15",
} as const;

export function FinanceStatCard({
  label,
  value,
  hint,
  accent = "slate",
  isCurrency = true,
}: {
  label: string;
  value: number | string;
  hint?: string;
  accent?: keyof typeof accentStyles;
  isCurrency?: boolean;
}) {
  const display =
    typeof value === "number"
      ? isCurrency
        ? formatMoney(value)
        : value.toLocaleString("en-GB")
      : value;

  return (
    <article className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`inline-flex rounded-xl bg-gradient-to-br px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${accentStyles[accent]}`}
      >
        {label}
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
        {display}
      </p>
      {hint ? <p className="mt-2 text-sm text-zinc-500">{hint}</p> : null}
    </article>
  );
}

export function FinanceSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
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

export function FinanceEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/10 to-violet-500/10 text-xl text-zinc-400">
        ◇
      </div>
      <h3 className="mt-4 text-sm font-semibold text-zinc-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function FinanceButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const variants = {
    primary: "bg-zinc-900 text-white hover:bg-zinc-800",
    secondary:
      "border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50",
    ghost: "text-teal-700 hover:bg-teal-50",
    danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]}`}
    >
      {children}
    </button>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const styles: Record<PaymentStatus, string> = {
    paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    pending: "bg-amber-50 text-amber-700 ring-amber-200",
    failed: "bg-rose-50 text-rose-700 ring-rose-200",
    refunded: "bg-violet-50 text-violet-700 ring-violet-200",
    partially_refunded: "bg-sky-50 text-sky-700 ring-sky-200",
  };
  const labels: Record<PaymentStatus, string> = {
    paid: "Paid",
    pending: "Pending",
    failed: "Failed",
    refunded: "Refunded",
    partially_refunded: "Partial refund",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export function PayoutStatusBadge({ status }: { status: PayoutStatus }) {
  const styles: Record<PayoutStatus, string> = {
    paid_out: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    pending: "bg-amber-50 text-amber-700 ring-amber-200",
    in_transit: "bg-sky-50 text-sky-700 ring-sky-200",
    held: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  };
  const labels: Record<PayoutStatus, string> = {
    paid_out: "Paid out",
    pending: "Pending",
    in_transit: "In transit",
    held: "Held",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export function RefundStatusBadge({ status }: { status: RefundStatus }) {
  const styles: Record<RefundStatus, string> = {
    completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    pending: "bg-amber-50 text-amber-700 ring-amber-200",
    failed: "bg-rose-50 text-rose-700 ring-rose-200",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export function RetryStatusBadge({ status }: { status: FailedPaymentRetryStatus }) {
  const styles: Record<FailedPaymentRetryStatus, string> = {
    ready: "bg-teal-50 text-teal-700 ring-teal-200",
    retrying: "bg-sky-50 text-sky-700 ring-sky-200",
    exhausted: "bg-rose-50 text-rose-700 ring-rose-200",
    manual_required: "bg-amber-50 text-amber-700 ring-amber-200",
  };
  const labels: Record<FailedPaymentRetryStatus, string> = {
    ready: "Ready to retry",
    retrying: "Retrying",
    exhausted: "Retries exhausted",
    manual_required: "Manual action",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export function FinanceTableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="min-w-full text-left text-sm">{children}</table>
    </div>
  );
}

export function stubAction(label: string) {
  return () => {
    window.alert(`${label} will be available when Stripe Connect is integrated.`);
  };
}

export function stubExportCsv(filename: string) {
  return () => {
    const blob = new Blob(["Activora finance export — demo data only\n"], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };
}
