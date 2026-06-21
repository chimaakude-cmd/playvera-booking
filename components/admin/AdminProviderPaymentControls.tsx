"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  ProviderPaymentAuditEntry,
  ProviderPaymentControls,
} from "@/lib/admin/provider-payment-controls";
import type { PayoutSchedule } from "@/lib/payments/club-payment-status";

type Props = {
  providerId: string;
};

async function parseError(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

function formatAuditChange(entry: ProviderPaymentAuditEntry): string {
  const keys = Object.keys(entry.newValues);
  if (keys.length === 0) {
    return entry.action;
  }
  return keys
    .map((key) => `${key}: ${String(entry.previousValues[key] ?? "—")} → ${String(entry.newValues[key])}`)
    .join("; ");
}

export function AdminProviderPaymentControls({ providerId }: Props) {
  const [controls, setControls] = useState<ProviderPaymentControls | null>(null);
  const [auditLog, setAuditLog] = useState<ProviderPaymentAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [paymentsEnabled, setPaymentsEnabled] = useState(true);
  const [paymentsPaused, setPaymentsPaused] = useState(false);
  const [payoutSchedule, setPayoutSchedule] = useState<PayoutSchedule>("weekly");
  const [feeOverride, setFeeOverride] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/providers/${providerId}/payment-controls`,
      );
      if (!response.ok) {
        throw new Error(
          await parseError(response, "Could not load payment controls."),
        );
      }

      const body = (await response.json()) as {
        controls: ProviderPaymentControls;
        auditLog: ProviderPaymentAuditEntry[];
      };

      setControls(body.controls);
      setAuditLog(body.auditLog);
      setPaymentsEnabled(body.controls.paymentsEnabled);
      setPaymentsPaused(body.controls.paymentsPaused);
      setPayoutSchedule(body.controls.payoutSchedule);
      setFeeOverride(
        body.controls.platformFeeOverridePercent !== null
          ? String(body.controls.platformFeeOverridePercent)
          : "",
      );
      setInternalNotes(body.controls.paymentInternalNotes);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load payment controls.",
      );
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const trimmedFee = feeOverride.trim();
    const platformFeeOverridePercent =
      trimmedFee.length === 0 ? null : Number(trimmedFee);

    if (
      trimmedFee.length > 0 &&
      (platformFeeOverridePercent === null ||
        !Number.isFinite(platformFeeOverridePercent) ||
        platformFeeOverridePercent < 0 ||
        platformFeeOverridePercent > 10)
    ) {
      setSaving(false);
      setError("Platform fee override must be between 0 and 10%.");
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/providers/${providerId}/payment-controls`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentsEnabled,
            paymentsPaused,
            payoutSchedule,
            platformFeeOverridePercent,
            paymentInternalNotes: internalNotes,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          await parseError(response, "Could not save payment controls."),
        );
      }

      const body = (await response.json()) as {
        controls: ProviderPaymentControls;
        auditLog: ProviderPaymentAuditEntry[];
      };

      setControls(body.controls);
      setAuditLog(body.auditLog);
      setSaved(true);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save payment controls.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-900">Payment controls</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Platform-managed GoCardless — changes are recorded in the audit log.
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-zinc-500">Loading…</p>
      ) : (
        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <label className="flex items-center justify-between gap-4 text-sm">
            <span className="text-zinc-700">Payments enabled</span>
            <input
              type="checkbox"
              checked={paymentsEnabled}
              onChange={(event) => setPaymentsEnabled(event.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-violet-600"
            />
          </label>

          <label className="flex items-center justify-between gap-4 text-sm">
            <span className="text-zinc-700">Pause payments</span>
            <input
              type="checkbox"
              checked={paymentsPaused}
              onChange={(event) => setPaymentsPaused(event.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-violet-600"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-zinc-600">
              Payout schedule
            </span>
            <select
              value={payoutSchedule}
              onChange={(event) =>
                setPayoutSchedule(event.target.value as PayoutSchedule)
              }
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-zinc-600">
              Override platform fee %
            </span>
            <input
              type="number"
              min={0}
              max={10}
              step={0.1}
              value={feeOverride}
              onChange={(event) => setFeeOverride(event.target.value)}
              placeholder="Use platform default"
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-zinc-600">
              Internal notes
            </span>
            <textarea
              value={internalNotes}
              onChange={(event) => setInternalNotes(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              placeholder="Admin-only notes about this club's payments"
            />
          </label>

          {controls?.paymentModel === "platform_managed" ? (
            <p className="text-xs text-zinc-500">
              Payment model: Activora platform-managed (no club OAuth).
            </p>
          ) : null}

          {error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </p>
          ) : null}

          {saved ? (
            <p className="text-xs text-emerald-600">Payment controls saved.</p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save payment controls"}
          </button>
        </form>
      )}

      <div className="mt-6 border-t border-zinc-100 pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Audit log
        </h3>
        {auditLog.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No payment control changes yet.</p>
        ) : (
          <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
            {auditLog.map((entry) => (
              <li
                key={entry.id}
                className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs text-zinc-700"
              >
                <span className="font-medium text-zinc-900">
                  {new Date(entry.createdAt).toLocaleString("en-GB")}
                </span>
                <span className="mx-2 text-zinc-300">·</span>
                {formatAuditChange(entry)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
