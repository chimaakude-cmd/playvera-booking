import { formatMoney } from "@/lib/payments";
import type { VatBreakdown } from "@/lib/club-finance/vat";

type VatBreakdownProps = {
  breakdown: VatBreakdown;
  compact?: boolean;
  className?: string;
};

export function VatBreakdownPanel({
  breakdown,
  compact = false,
  className = "",
}: VatBreakdownProps) {
  if (!breakdown.vatEnabled) {
    return (
      <dl
        className={`space-y-2 text-sm ${className}`}
        aria-label="Price breakdown"
      >
        <Row label="Amount" value={breakdown.grossAmount} emphasis />
      </dl>
    );
  }

  return (
    <dl
      className={`space-y-2 text-sm ${className}`}
      aria-label="VAT breakdown"
    >
      <Row label="Net amount" value={breakdown.netAmount} />
      <Row
        label={`VAT (${breakdown.vatRatePercent}%)`}
        value={breakdown.vatAmount}
      />
      <div className={compact ? "border-t border-zinc-200 pt-2" : "border-t border-zinc-200 pt-2"}>
        <Row label="Gross amount" value={breakdown.grossAmount} emphasis />
      </div>
    </dl>
  );
}

function Row({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className={emphasis ? "font-medium text-zinc-900" : "text-zinc-500"}>
        {label}
      </dt>
      <dd
        className={
          emphasis
            ? "font-semibold text-zinc-900"
            : "font-medium text-zinc-900"
        }
      >
        {formatMoney(value)}
      </dd>
    </div>
  );
}
