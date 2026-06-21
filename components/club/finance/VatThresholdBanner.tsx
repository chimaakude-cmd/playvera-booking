import {
  getThresholdProgress,
  getVatThresholdWarning,
  UK_VAT_REGISTRATION_THRESHOLD,
} from "@/lib/club-finance";
import { formatMoney } from "@/lib/payments";

export function VatThresholdBanner({
  rollingRevenue,
}: {
  rollingRevenue: number;
}) {
  const warning = getVatThresholdWarning(rollingRevenue);
  const progress = getThresholdProgress(rollingRevenue);

  if (!warning) {
    return (
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              Rolling 12-month revenue
            </h3>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
              {formatMoney(rollingRevenue)}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              UK VAT registration threshold: more than{" "}
              {formatMoney(UK_VAT_REGISTRATION_THRESHOLD)} taxable turnover in a
              rolling 12-month period.
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            Below threshold
          </span>
        </div>
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-zinc-400">{progress}% of threshold</p>
        </div>
      </div>
    );
  }

  const styles =
    warning.stage === "reached"
      ? "border-rose-200 bg-rose-50/80"
      : "border-sky-200 bg-sky-50/80";

  const badgeStyles =
    warning.stage === "reached"
      ? "bg-rose-100 text-rose-800 ring-rose-200"
      : "bg-sky-100 text-sky-800 ring-sky-200";

  const barColor =
    warning.stage === "reached" ? "bg-rose-500" : "bg-sky-500";

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${styles}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">
            VAT threshold warning
          </h3>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            {formatMoney(rollingRevenue)}
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            {warning.message}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${badgeStyles}`}
        >
          {warning.stage === "reached"
            ? "Threshold reached"
            : "Approaching threshold"}
        </span>
      </div>
      <div className="mt-4">
        <div className="h-2 overflow-hidden rounded-full bg-white/70">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          {progress}% of {formatMoney(UK_VAT_REGISTRATION_THRESHOLD)} threshold
        </p>
      </div>
    </div>
  );
}
