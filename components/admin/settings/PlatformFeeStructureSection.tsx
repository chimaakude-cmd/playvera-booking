"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calculatePlatformFeeAmount,
  DEFAULT_PLATFORM_FEE_MATRIX,
  MAX_PLATFORM_FEE_PERCENT,
  MIN_PLATFORM_FEE_PERCENT,
  PLATFORM_FEE_TIERS,
  validatePlatformFeeMatrix,
  validatePlatformFeePercent,
  type PlatformFeeMatrix,
} from "@/lib/fee-settings";
import { invalidatePlatformPublicSettingsCache } from "@/lib/platform-settings/client-cache";
import type { PlatformSettingsPayload } from "@/lib/platform-settings/types";
import { formatMoney } from "@/lib/payments";
import type { PlanId } from "@/src/config/pricing";

const PREVIEW_BOOKING_AMOUNT = 100;

async function fetchPlatformSettings(): Promise<PlatformSettingsPayload> {
  const response = await fetch("/api/admin/platform-settings", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load platform settings.");
  }

  const data = (await response.json()) as { settings: PlatformSettingsPayload };
  return data.settings;
}

export function PlatformFeeStructureSection() {
  const [matrix, setMatrix] = useState<PlatformFeeMatrix>(
    DEFAULT_PLATFORM_FEE_MATRIX,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const settings = await fetchPlatformSettings();
        if (!cancelled) {
          setMatrix(settings.defaultFees);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load platform settings.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
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

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();

    if (!validatePlatformFeeMatrix(matrix)) {
      setError(
        `Each fee must be between ${MIN_PLATFORM_FEE_PERCENT}% and ${MAX_PLATFORM_FEE_PERCENT}%.`,
      );
      return;
    }

    setSaving(true);
    setSaved(false);

    try {
      const response = await fetch("/api/admin/platform-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultFees: matrix }),
      });

      if (!response.ok) {
        throw new Error("Save failed");
      }

      const data = (await response.json()) as { settings: PlatformSettingsPayload };
      setMatrix(data.settings.defaultFees);
      invalidatePlatformPublicSettingsCache();
      setSaved(true);
      setError(null);
    } catch {
      setError("Unable to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const response = await fetch("/api/admin/platform-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      });

      if (!response.ok) {
        throw new Error("Reset failed");
      }

      const data = (await response.json()) as { settings: PlatformSettingsPayload };
      setMatrix(data.settings.defaultFees);
      invalidatePlatformPublicSettingsCache();
      setSaved(true);
    } catch {
      setError("Unable to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
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

      {loading ? (
        <p className="text-sm text-zinc-500">Loading fee structure…</p>
      ) : null}

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
                    disabled={loading || saving}
                    className={`w-full rounded-xl border px-4 py-2.5 pr-8 text-sm text-zinc-900 outline-none transition focus:ring-2 disabled:opacity-60 ${
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
          disabled={loading || saving}
          className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save fee structure"}
        </button>
        <button
          type="button"
          onClick={() => void handleReset()}
          disabled={loading || saving}
          className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60"
        >
          Reset to defaults
        </button>
        {saved ? (
          <span className="text-sm font-medium text-emerald-600">
            Settings saved successfully.
          </span>
        ) : null}
      </div>
    </form>
  );
}
