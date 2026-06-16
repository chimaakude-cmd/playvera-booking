"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BILLING_PERIOD_LABELS,
  FRANCHISOR_FEE_TYPE_LABELS,
  type BillingPeriod,
  type FranchisorFeeSettings,
  type FranchisorFeeType,
  type PerFranchiseeFeeOverride,
} from "@/lib/finance-payouts";
import { getFranchiseeClubs } from "@/lib/organisation";
import {
  getFeeOverrides,
  getFranchisorFeeSettings,
  saveFeeOverrides,
  saveFranchisorFeeSettings,
} from "@/lib/finance-payouts/storage";

type FranchisorFeeSettingsFormProps = {
  onSaved?: () => void;
  compact?: boolean;
};

export function FranchisorFeeSettingsForm({
  onSaved,
  compact = false,
}: FranchisorFeeSettingsFormProps) {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<FranchisorFeeSettings | null>(null);
  const [overrides, setOverrides] = useState<PerFranchiseeFeeOverride[]>([]);

  useEffect(() => {
    setSettings(getFranchisorFeeSettings());
    setOverrides(getFeeOverrides());
  }, []);

  const clubs = useMemo(() => getFranchiseeClubs(), []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) {
      return;
    }
    saveFranchisorFeeSettings({
      organisationId: settings.organisationId,
      feeType: settings.feeType,
      percentageFee: settings.percentageFee,
      minimumFee: settings.minimumFee,
      fixedFee: settings.fixedFee,
      billingPeriod: settings.billingPeriod,
      appliesToAll: settings.appliesToAll,
      allowPerFranchiseeOverride: settings.allowPerFranchiseeOverride,
    });
    saveFeeOverrides(overrides);
    setSaved(true);
    onSaved?.();
  }

  function updateOverride(
    clubId: string,
    clubName: string,
    patch: Partial<PerFranchiseeFeeOverride>,
  ) {
    setOverrides((current) => {
      const existing = current.find((o) => o.clubId === clubId);
      if (existing) {
        return current.map((o) =>
          o.clubId === clubId ? { ...o, ...patch } : o,
        );
      }
      return [...current, { clubId, clubName, ...patch }];
    });
    setSaved(false);
  }

  if (!settings) {
    return null;
  }

  const showPercentage =
    settings.feeType === "percentage" ||
    settings.feeType === "percentage_plus_fixed" ||
    settings.feeType === "higher_of_percentage_or_minimum";
  const showMinimum =
    settings.feeType === "higher_of_percentage_or_minimum";
  const showFixed =
    settings.feeType === "fixed_monthly" ||
    settings.feeType === "percentage_plus_fixed";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {saved ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Franchisor fee settings saved successfully.
        </div>
      ) : null}

      <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-sm text-amber-900">
        Franchisor fees are separate from the Activora 2% platform fee and Stripe
        processing fees. They are retained by your organisation before
        franchisee payouts.
      </div>

      <div className={`grid gap-4 ${compact ? "sm:grid-cols-2" : "lg:grid-cols-2"}`}>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-zinc-700">Fee type</span>
          <select
            value={settings.feeType}
            onChange={(e) => {
              setSettings((s) =>
                s
                  ? { ...s, feeType: e.target.value as FranchisorFeeType }
                  : s,
              );
              setSaved(false);
            }}
            className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900"
          >
            {(Object.keys(FRANCHISOR_FEE_TYPE_LABELS) as FranchisorFeeType[]).map(
              (type) => (
                <option key={type} value={type}>
                  {FRANCHISOR_FEE_TYPE_LABELS[type]}
                </option>
              ),
            )}
          </select>
        </label>

        {showPercentage ? (
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">
              Percentage fee (%)
            </span>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={settings.percentageFee}
              onChange={(e) => {
                setSettings((s) =>
                  s ? { ...s, percentageFee: Number(e.target.value) } : s,
                );
                setSaved(false);
              }}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900"
            />
          </label>
        ) : null}

        {showMinimum ? (
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">
              Minimum fee (£)
            </span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={settings.minimumFee}
              onChange={(e) => {
                setSettings((s) =>
                  s ? { ...s, minimumFee: Number(e.target.value) } : s,
                );
                setSaved(false);
              }}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900"
            />
          </label>
        ) : null}

        {showFixed ? (
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">
              Fixed fee (£)
            </span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={settings.fixedFee}
              onChange={(e) => {
                setSettings((s) =>
                  s ? { ...s, fixedFee: Number(e.target.value) } : s,
                );
                setSaved(false);
              }}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900"
            />
          </label>
        ) : null}

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Billing period
          </span>
          <select
            value={settings.billingPeriod}
            onChange={(e) => {
              setSettings((s) =>
                s
                  ? { ...s, billingPeriod: e.target.value as BillingPeriod }
                  : s,
              );
              setSaved(false);
            }}
            className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900"
          >
            {(Object.keys(BILLING_PERIOD_LABELS) as BillingPeriod[]).map(
              (period) => (
                <option key={period} value={period}>
                  {BILLING_PERIOD_LABELS[period]}
                </option>
              ),
            )}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={settings.appliesToAll}
            onChange={(e) => {
              setSettings((s) =>
                s ? { ...s, appliesToAll: e.target.checked } : s,
              );
              setSaved(false);
            }}
            className="h-4 w-4 rounded border-zinc-300 text-violet-600"
          />
          <span className="text-sm text-zinc-700">
            Applies to all franchisees
          </span>
        </label>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={settings.allowPerFranchiseeOverride}
            onChange={(e) => {
              setSettings((s) =>
                s
                  ? { ...s, allowPerFranchiseeOverride: e.target.checked }
                  : s,
              );
              setSaved(false);
            }}
            className="h-4 w-4 rounded border-zinc-300 text-violet-600"
          />
          <span className="text-sm text-zinc-700">
            Allow override per franchisee
          </span>
        </label>
      </div>

      {settings.allowPerFranchiseeOverride ? (
        <div className="overflow-x-auto rounded-xl border border-zinc-100">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/80 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <th className="px-4 py-3">Club</th>
                <th className="px-4 py-3">Fee type</th>
                <th className="px-4 py-3">%</th>
                <th className="px-4 py-3">Min (£)</th>
                <th className="px-4 py-3">Fixed (£)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {clubs.map((club) => {
                const override = overrides.find((o) => o.clubId === club.id);
                const feeType = override?.feeType ?? settings.feeType;
                return (
                  <tr key={club.id}>
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {club.name}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={feeType}
                        onChange={(e) =>
                          updateOverride(club.id, club.name, {
                            feeType: e.target.value as FranchisorFeeType,
                          })
                        }
                        className="rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                      >
                        {(Object.keys(FRANCHISOR_FEE_TYPE_LABELS) as FranchisorFeeType[]).map(
                          (type) => (
                            <option key={type} value={type}>
                              {FRANCHISOR_FEE_TYPE_LABELS[type]}
                            </option>
                          ),
                        )}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={override?.percentageFee ?? settings.percentageFee}
                        onChange={(e) =>
                          updateOverride(club.id, club.name, {
                            percentageFee: Number(e.target.value),
                          })
                        }
                        className="w-20 rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={override?.minimumFee ?? settings.minimumFee}
                        onChange={(e) =>
                          updateOverride(club.id, club.name, {
                            minimumFee: Number(e.target.value),
                          })
                        }
                        className="w-20 rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={override?.fixedFee ?? settings.fixedFee}
                        onChange={(e) =>
                          updateOverride(club.id, club.name, {
                            fixedFee: Number(e.target.value),
                          })
                        }
                        className="w-20 rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      <button
        type="submit"
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
      >
        Save franchisor fees
      </button>
    </form>
  );
}
