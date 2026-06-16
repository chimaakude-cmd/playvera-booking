import { getFeeSettings } from "@/lib/fee-settings";
import {
  calculatePaymentBreakdown,
  formatMoney,
  PaymentBreakdown,
} from "@/lib/payments";

type ProviderPayoutBreakdownProps = {
  listPrice: number;
  platformFeePercent?: number;
  compact?: boolean;
};

export function ProviderPayoutBreakdown({
  listPrice,
  platformFeePercent,
  compact = false,
}: ProviderPayoutBreakdownProps) {
  const settings = getFeeSettings();
  const breakdown = calculatePaymentBreakdown(
    listPrice,
    platformFeePercent ?? settings.platformFeePercent,
    settings.feeHandling,
  );

  return (
    <div
      className={
        compact
          ? "rounded-xl border border-zinc-100 bg-zinc-50 p-4"
          : "rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
      }
    >
      {!compact ? (
        <>
          <h3 className="text-base font-semibold text-zinc-900">
            Provider payout estimate
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Estimated split before Stripe Connect is enabled.
          </p>
        </>
      ) : (
        <h4 className="text-sm font-semibold text-zinc-900">
          Payout estimate
        </h4>
      )}
      <PayoutRows breakdown={breakdown} className={compact ? "mt-3" : "mt-4"} />
    </div>
  );
}

type PayoutRowsProps = {
  breakdown: PaymentBreakdown;
  className?: string;
};

export function PayoutRows({ breakdown, className = "" }: PayoutRowsProps) {
  return (
    <dl className={`space-y-2 text-sm ${className}`}>
      <Row label="Customer price" value={breakdown.customerPrice} />
      <Row
        label={`Activora platform fee (${breakdown.platformFeePercent}%)`}
        value={breakdown.platformFee}
      />
      <Row
        label="Estimated Stripe processing fee"
        value={breakdown.estimatedStripeFee}
      />
      <div className="border-t border-zinc-200 pt-2">
        <Row
          label="Estimated provider payout"
          value={breakdown.estimatedProviderPayout}
          emphasis
        />
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
