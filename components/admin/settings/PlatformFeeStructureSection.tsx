"use client";

import { useEffect, useMemo, useState } from "react";
import { getAdminSession } from "@/lib/admin";
import {
  calculatePlatformFeeAmount,
  DEFAULT_PLATFORM_FEE_MATRIX,
  getPlatformFeeAuditLog,
  getPlatformFeeMatrix,
  MAX_PLATFORM_FEE_PERCENT,
  MIN_PLATFORM_FEE_PERCENT,
  PLATFORM_FEE_TIERS,
  resetPlatformFeeMatrix,
  savePlatformFeeMatrix,
  validatePlatformFeeMatrix,
  validatePlatformFeePercent,
  type PlatformFeeAuditEntry,
  type PlatformFeeMatrix,
} from "@/lib/fee-settings";
import { formatMoney } from "@/lib/payments";
import type { PlanId } from "@/src/config/pricing";

const PREVIEW_BOOKING_AMOUNT = 100;

function formatAuditSummary(entry: PlatformFeeAuditEntry): string {
  const changes = PLATFORM_FEE_TIERS.filter(
    (tier) => entry.previous[tier.planId] !== entry.next[tier.planId],
  ).map(
    (tier) =>
      `${tier.label}: ${entry.previous[tier.planId]}% → ${entry.next[tier.planId]}%`,
  );

  return changes.join(", ");
}

function formatAuditTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function PlatformFeeStructureSection() {
  const [matrix, setMatrix] = useState<PlatformFeeMatrix>(
    DEFAULT_PLATFORM_FEE_MATRIX,
  );
  const [auditLog, setAuditLog] = useState<PlatformFeeAuditEntry[]>([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMatrix(getPlatformFeeMatrix());
    setAuditLog(getPlatformFeeAuditLog());
  }, []);

  const preview = useMemo(
    () =>
      PLATFORM_FEE_TIERS.map((tier) => ({
        label: tier.label,
        amount: calculatePlatformFeeAmount(
          PREVIEW_BOOKING_AMOUNT,
          matrix[tier.planId],
        ),
      })),
    [matrix],
  );

  function handleTierChange(planId: PlanId, rawValue: string) {
    const value = Number(rawValue);
    setMatrix((current) => ({ ...current, [planId]: value }));
    setSaved(false);
    setError(null);
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault();

    if (!validatePlatformFeeMatrix(matrix)) {
      setError(
        `Each fee must be between ${MIN_PLATFORM_FEE_PERCENT}% and ${MAX_PLATFORM_FEE_PERCENT}%.`,
      );
      return;
    }

    const session = getAdminSession();
    savePlatformFeeMatrix(matrix, {
      name: session?.name ?? "Platform Admin",
      email: session?.email ?? "admin@activora.co.uk",
    });

    setAuditLog(getPlatformFeeAuditLog());
    setSaved(true);
    setError(null);
  }

  function handleReset() {
    const defaults = resetPlatformFeeMatrix();
    setMatrix(defaults);
    setSaved(false);
    setError(null);
  }

  return (
    <form
      onSubmit={handleSave}
      className="max-w-3xl space-y-6 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          Platform fee structure
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Platform fees apply per successful booking transaction.
        </p>
      </div>

      <div className="space-y-3">
        {PLATFORM_FEE_TIERS.map((tier) => {
          const value = matrix[tier.planId];
          const isValid = validatePlatformFeePercent(value);

          return (
            <div
              key={tier.planId}
              className="grid gap-3 rounded-xl border border-zinc-200 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_120px]"
            >
              <div>
                <p className="text-sm font-medium text-zinc-900">{tier.label}</p>
                <p className="text-xs text-zinc-500">{tier.description}</p>
              </div>
              <label className="block">
                <span className="sr-only">{tier.label} fee percent</span>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min={MIN_PLATFORM_FEE_PERCENT}
                    max={MAX_PLATFORM_FEE_PERCENT}
                    value={Number.isFinite(value) ? value : ""}
                    onChange={(event) =>
                      handleTierChange(tier.planId, event.target.value)
                    }
                    className={`w-full rounded-xl border px-4 py-2.5 pr-8 text-sm text-zinc-900 outline-none transition focus:ring-2 ${
                      isValid
                        ? "border-zinc-200 focus:border-violet-300 focus:ring-violet-500/20"
                        : "border-red-300 focus:border-red-300 focus:ring-red-500/20"
                    }`}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-zinc-400">
                    %
                  </span>
                </div>
              </label>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
          Preview
        </p>
        <p className="mt-2 text-sm text-zinc-700">
          {formatMoney(PREVIEW_BOOKING_AMOUNT)} booking →{" "}
          {preview
            .map((item) => `${item.label} ${formatMoney(item.amount)}`)
            .join(", ")}
        </p>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-5">
        <button
          type="submit"
          className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          Save fee structure
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Reset to defaults
        </button>
        {saved ? (
          <span className="text-sm font-medium text-emerald-600">
            Fee structure saved.
          </span>
        ) : null}
      </div>

      <div className="space-y-3 border-t border-zinc-100 pt-5">
        <h3 className="text-sm font-semibold text-zinc-900">Audit history</h3>
        {auditLog.length === 0 ? (
          <p className="text-sm text-zinc-500">No fee changes recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {auditLog.map((entry) => (
              <li
                key={entry.id}
                className="rounded-xl border border-zinc-200 px-4 py-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-zinc-900">{entry.changedBy}</p>
                  <p className="text-xs text-zinc-500">
                    {formatAuditTimestamp(entry.changedAt)}
                  </p>
                </div>
                <p className="mt-1 text-xs text-zinc-500">{entry.changedByEmail}</p>
                <p className="mt-2 text-sm text-zinc-700">
                  {formatAuditSummary(entry)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-zinc-400">
        Fee tiers are stored in localStorage for demo purposes. Clubs inherit
        the rate for their account type via resolvePlatformFeePercent().
      </p>
    </form>
  );
}
