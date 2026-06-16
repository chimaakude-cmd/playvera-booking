"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  getPayoutScheduleHelperText,
  PAYOUT_FREQUENCY_LABELS,
  type FranchiseePayoutSchedule,
  type PerFranchiseePayoutOverride,
  type PayoutFrequency,
} from "@/lib/finance-payouts";
import {
  getFranchiseeClubs,
} from "@/lib/organisation";
import {
  getPayoutOverrides,
  getPayoutSchedule,
  savePayoutOverrides,
  savePayoutSchedule,
} from "@/lib/finance-payouts/storage";
import { formatFinanceShortDate } from "@/lib/club-finance";

type PayoutScheduleFormProps = {
  onSaved?: () => void;
  compact?: boolean;
};

export function PayoutScheduleForm({
  onSaved,
  compact = false,
}: PayoutScheduleFormProps) {
  const [saved, setSaved] = useState(false);
  const [schedule, setSchedule] = useState<FranchiseePayoutSchedule | null>(
    null,
  );
  const [overrides, setOverrides] = useState<PerFranchiseePayoutOverride[]>([]);

  useEffect(() => {
    setSchedule(getPayoutSchedule());
    setOverrides(getPayoutOverrides());
  }, []);

  const clubs = useMemo(() => getFranchiseeClubs(), []);
  const helperText = schedule
    ? getPayoutScheduleHelperText(schedule.frequency, schedule.monthlyDay)
    : "";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!schedule) {
      return;
    }
    savePayoutSchedule({
      organisationId: schedule.organisationId,
      frequency: schedule.frequency,
      monthlyDay: schedule.monthlyDay,
      holdPeriodDays: schedule.holdPeriodDays,
      appliesToAll: schedule.appliesToAll,
      allowPerFranchiseeOverride: schedule.allowPerFranchiseeOverride,
    });
    savePayoutOverrides(overrides);
    setSaved(true);
    setSchedule(getPayoutSchedule());
    onSaved?.();
  }

  function updateOverride(
    clubId: string,
    clubName: string,
    patch: Partial<PerFranchiseePayoutOverride>,
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

  if (!schedule) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {saved ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Payout schedule saved successfully.
        </div>
      ) : null}

      <div className={`grid gap-4 ${compact ? "sm:grid-cols-2" : "lg:grid-cols-2"}`}>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Payout frequency
          </span>
          <select
            value={schedule.frequency}
            onChange={(e) => {
              setSchedule((s) =>
                s
                  ? {
                      ...s,
                      frequency: e.target.value as PayoutFrequency,
                    }
                  : s,
              );
              setSaved(false);
            }}
            className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900"
          >
            {(Object.keys(PAYOUT_FREQUENCY_LABELS) as PayoutFrequency[]).map(
              (freq) => (
                <option key={freq} value={freq}>
                  {PAYOUT_FREQUENCY_LABELS[freq]}
                </option>
              ),
            )}
          </select>
        </label>

        {schedule.frequency === "monthly" ? (
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">
              Monthly payout day
            </span>
            <select
              value={schedule.monthlyDay}
              onChange={(e) => {
                setSchedule((s) =>
                  s ? { ...s, monthlyDay: Number(e.target.value) } : s,
                );
                setSaved(false);
              }}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900"
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Hold period (days)
          </span>
          <input
            type="number"
            min={0}
            max={30}
            value={schedule.holdPeriodDays}
            onChange={(e) => {
              setSchedule((s) =>
                s
                  ? { ...s, holdPeriodDays: Number(e.target.value) }
                  : s,
              );
              setSaved(false);
            }}
            className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900"
          />
        </label>

        <div className="block">
          <span className="text-sm font-medium text-zinc-700">
            Next scheduled payout
          </span>
          <p className="mt-1.5 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5 text-sm font-semibold text-zinc-900">
            {schedule.nextScheduledPayout
              ? formatFinanceShortDate(schedule.nextScheduledPayout)
              : "—"}
          </p>
        </div>
      </div>

      {helperText ? (
        <p className="text-sm text-violet-700/90">{helperText}</p>
      ) : null}

      <div className="flex flex-wrap gap-6">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={schedule.appliesToAll}
            onChange={(e) => {
              setSchedule((s) =>
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
            checked={schedule.allowPerFranchiseeOverride}
            onChange={(e) => {
              setSchedule((s) =>
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

      {schedule.allowPerFranchiseeOverride ? (
        <div className="overflow-x-auto rounded-xl border border-zinc-100">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/80 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <th className="px-4 py-3">Club</th>
                <th className="px-4 py-3">Frequency</th>
                <th className="px-4 py-3">Monthly day</th>
                <th className="px-4 py-3">Hold (days)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {clubs.map((club) => {
                const override = overrides.find((o) => o.clubId === club.id);
                return (
                  <tr key={club.id}>
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {club.name}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={override?.frequency ?? schedule.frequency}
                        onChange={(e) =>
                          updateOverride(club.id, club.name, {
                            frequency: e.target.value as PayoutFrequency,
                          })
                        }
                        className="rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                      >
                        {(Object.keys(PAYOUT_FREQUENCY_LABELS) as PayoutFrequency[]).map(
                          (freq) => (
                            <option key={freq} value={freq}>
                              {PAYOUT_FREQUENCY_LABELS[freq]}
                            </option>
                          ),
                        )}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={override?.monthlyDay ?? schedule.monthlyDay}
                        onChange={(e) =>
                          updateOverride(club.id, club.name, {
                            monthlyDay: Number(e.target.value),
                          })
                        }
                        className="rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                        disabled={
                          (override?.frequency ?? schedule.frequency) !==
                          "monthly"
                        }
                      >
                        {Array.from({ length: 28 }, (_, i) => i + 1).map(
                          (day) => (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          ),
                        )}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        max={30}
                        value={
                          override?.holdPeriodDays ?? schedule.holdPeriodDays
                        }
                        onChange={(e) =>
                          updateOverride(club.id, club.name, {
                            holdPeriodDays: Number(e.target.value),
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
        Save payout schedule
      </button>
    </form>
  );
}
