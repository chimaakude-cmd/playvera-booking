"use client";

import type { ClubDiscount } from "@/lib/club-discounts";
import {
  APPLIES_TO_LABELS,
  AUTO_APPLIES_TO_LABELS,
  DISCOUNT_KIND_LABELS,
  DISCOUNT_STATUS_LABELS,
  formatDiscountDeadline,
  formatDiscountValue,
  resolveDiscountStatus,
} from "@/lib/club-discounts";

type DiscountsTableProps = {
  discounts: ClubDiscount[];
  canManage: boolean;
  onEdit: (discount: ClubDiscount) => void;
  onDuplicate: (discount: ClubDiscount) => void;
  onPause: (discount: ClubDiscount) => void;
  onArchive: (discount: ClubDiscount) => void;
};

function statusTone(status: ReturnType<typeof resolveDiscountStatus>) {
  if (status === "active") return "text-emerald-700 bg-emerald-50";
  if (status === "paused" || status === "inactive") {
    return "text-amber-800 bg-amber-50";
  }
  if (status === "expired" || status === "archived") {
    return "text-zinc-500 bg-zinc-100";
  }
  return "text-sky-700 bg-sky-50";
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRedemptions(discount: ClubDiscount): string {
  const used = discount.redemptionCount;
  if (discount.kind === "early_bird" && discount.usageLimitTotal !== null) {
    return `${used} / ${discount.usageLimitTotal}`;
  }

  return String(used);
}

function getAppliesLabel(discount: ClubDiscount): string {
  if (discount.appliesToLabel) {
    return discount.appliesToLabel;
  }

  if (
    discount.kind === "sibling" ||
    discount.kind === "early_bird"
  ) {
    const autoLabel =
      AUTO_APPLIES_TO_LABELS[
        discount.appliesTo as keyof typeof AUTO_APPLIES_TO_LABELS
      ];
    if (autoLabel) {
      return autoLabel;
    }
  }

  return APPLIES_TO_LABELS[discount.appliesTo];
}

export function DiscountsTable({
  discounts,
  canManage,
  onEdit,
  onDuplicate,
  onPause,
  onArchive,
}: DiscountsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-zinc-50/80 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Value</th>
            <th className="px-4 py-3">Applies to</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Redemptions</th>
            <th className="px-4 py-3">Start date</th>
            <th className="px-4 py-3">End / deadline</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {discounts.map((discount) => {
            const status = resolveDiscountStatus(discount);
            const appliesLabel = getAppliesLabel(discount);

            return (
              <tr key={discount.id} className="align-top hover:bg-zinc-50/50">
                <td className="px-4 py-4 font-medium text-zinc-900">
                  {discount.name}
                </td>
                <td className="px-4 py-4 text-zinc-700">
                  {DISCOUNT_KIND_LABELS[discount.kind ?? "promo"]}
                </td>
                <td className="px-4 py-4 font-semibold text-zinc-900">
                  {formatDiscountValue(discount)}
                </td>
                <td className="px-4 py-4 text-zinc-600">{appliesLabel}</td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone(status)}`}
                  >
                    {DISCOUNT_STATUS_LABELS[status]}
                  </span>
                </td>
                <td className="px-4 py-4 text-zinc-700">
                  {formatRedemptions(discount)}
                </td>
                <td className="px-4 py-4 text-zinc-600">
                  {formatDate(discount.startDate)}
                </td>
                <td className="px-4 py-4 text-zinc-600">
                  {formatDiscountDeadline(discount)}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      disabled={!canManage}
                      onClick={() => onEdit(discount)}
                      className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={!canManage}
                      onClick={() => onDuplicate(discount)}
                      className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      disabled={!canManage || discount.isArchived}
                      onClick={() => onPause(discount)}
                      className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {discount.isPaused ? "Resume" : "Pause"}
                    </button>
                    <button
                      type="button"
                      disabled={!canManage || discount.isArchived}
                      onClick={() => onArchive(discount)}
                      className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
