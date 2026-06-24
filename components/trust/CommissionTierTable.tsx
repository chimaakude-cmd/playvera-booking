import { TRUST_PLATFORM_FEE_NOTE } from "@/constants/trust-payments";

type CommissionTierTableProps = {
  caption?: string;
};

/** Platform fee callout — tier tables removed; single standard fee messaging only. */
export function CommissionTierTable({ caption }: CommissionTierTableProps) {
  return (
    <div
      className="not-prose rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400"
      aria-label={caption ?? "Activora platform fee"}
    >
      <p>{TRUST_PLATFORM_FEE_NOTE}</p>
    </div>
  );
}
