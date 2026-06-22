import { formatMoney } from "@/lib/payments";

export type PaymentFeeExampleProps = {
  paymentMethod: string;
  bookingAmount: number;
  activoraFeePercent: number;
  estimatedProcessorFeeLabel: string;
  estimatedProcessorFeeAmount: number;
  providerReceivesLabel?: string;
  compact?: boolean;
};

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function PaymentFeeExample({
  paymentMethod,
  bookingAmount,
  activoraFeePercent,
  estimatedProcessorFeeLabel,
  estimatedProcessorFeeAmount,
  providerReceivesLabel = "Estimated provider receives",
  compact = false,
}: PaymentFeeExampleProps) {
  const activoraFee = roundMoney((bookingAmount * activoraFeePercent) / 100);
  const providerReceives = roundMoney(
    Math.max(0, bookingAmount - activoraFee - estimatedProcessorFeeAmount),
  );

  return (
    <aside
      className={
        compact
          ? "rounded-xl border border-zinc-200 bg-zinc-50 p-4"
          : "rounded-2xl border border-teal-100 bg-teal-50/40 p-5 sm:p-6"
      }
      aria-label={`${paymentMethod} fee example`}
    >
      <h3
        className={
          compact
            ? "text-sm font-semibold text-zinc-900"
            : "text-base font-semibold text-zinc-900"
        }
      >
        Example: {formatMoney(bookingAmount)} booking via {paymentMethod}
      </h3>
      <p className="mt-1 text-xs text-zinc-500">
        Illustrative only — actual fees may vary.
      </p>

      <dl className="mt-4 space-y-2 text-sm">
        <FeeRow label="Booking price" value={bookingAmount} />
        <FeeRow
          label={`Activora platform fee (around ${activoraFeePercent}%)`}
          value={activoraFee}
          deduction
        />
        <FeeRow
          label={estimatedProcessorFeeLabel}
          value={estimatedProcessorFeeAmount}
          deduction
        />
        <div className="border-t border-zinc-200/80 pt-2">
          <FeeRow label={providerReceivesLabel} value={providerReceives} emphasis />
        </div>
      </dl>
    </aside>
  );
}

function FeeRow({
  label,
  value,
  deduction = false,
  emphasis = false,
}: {
  label: string;
  value: number;
  deduction?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className={emphasis ? "font-medium text-zinc-900" : "text-zinc-600"}>
        {label}
      </dt>
      <dd
        className={
          emphasis
            ? "shrink-0 font-semibold text-zinc-900"
            : "shrink-0 font-medium text-zinc-900"
        }
      >
        {deduction ? "−" : ""}
        {formatMoney(value)}
      </dd>
    </div>
  );
}
