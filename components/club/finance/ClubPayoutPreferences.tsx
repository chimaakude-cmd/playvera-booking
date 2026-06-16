"use client";

import { FormEvent, useEffect, useState } from "react";
import { formatFinanceShortDate } from "@/lib/club-finance";
import {
  getPayoutScheduleHelperText,
  PAYOUT_FREQUENCY_LABELS,
  type ClubPayoutPreferences,
  type PayoutFrequency,
} from "@/lib/finance-payouts";
import {
  getClubPayoutPreferences,
  saveClubPayoutPreferences,
} from "@/lib/finance-payouts/storage";
import { DEMO_FRANCHISEE_PROVIDER_ID } from "@/lib/organisation/defaults";
import { useFranchiseePolicy } from "@/lib/organisation";
import {
  FinanceButton,
  FinanceSection,
  FinanceStatCard,
} from "./shared";

export function ClubPayoutPreferences() {
  const {
    isManaged,
    organisation,
    franchiseeClub,
    isPayoutScheduleLocked,
    payoutLockedMessage,
  } = useFranchiseePolicy();
  const clubId = franchiseeClub?.providerId ?? DEMO_FRANCHISEE_PROVIDER_ID;
  const locked = isManaged && isPayoutScheduleLocked();

  const [saved, setSaved] = useState(false);
  const [prefs, setPrefs] = useState<ClubPayoutPreferences | null>(null);

  useEffect(() => {
    setPrefs(getClubPayoutPreferences(clubId));
  }, [clubId]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!prefs || locked) {
      return;
    }
    saveClubPayoutPreferences({
      clubId: prefs.clubId,
      frequency: prefs.frequency,
      monthlyDay: prefs.monthlyDay,
      availableBalance: prefs.availableBalance,
      pendingBalance: prefs.pendingBalance,
    });
    setPrefs(getClubPayoutPreferences(clubId));
    setSaved(true);
  }

  if (!prefs) {
    return null;
  }

  const helperText = getPayoutScheduleHelperText(
    prefs.frequency,
    prefs.monthlyDay,
  );

  return (
    <div className="space-y-6">
      {locked && organisation ? (
        <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
          {payoutLockedMessage}
        </div>
      ) : null}

      {saved && !locked ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Payout preferences saved successfully.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <FinanceStatCard
          label="Available balance"
          value={prefs.availableBalance}
          hint="Ready for next payout"
          accent="emerald"
        />
        <FinanceStatCard
          label="Pending balance"
          value={prefs.pendingBalance}
          hint="Clearing period"
          accent="amber"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <FinanceSection
          title="Payout preferences"
          description={
            locked
              ? "Your franchisor controls when payouts are released."
              : "Choose how often you receive payouts from Stripe Connect."
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className="text-sm font-medium text-zinc-700">
                Payout frequency
              </span>
              <select
                value={prefs.frequency}
                disabled={locked}
                onChange={(e) => {
                  setPrefs((p) =>
                    p
                      ? {
                          ...p,
                          frequency: e.target.value as PayoutFrequency,
                        }
                      : p,
                  );
                  setSaved(false);
                }}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-500"
              >
                {(
                  ["every_3_days", "every_7_days", "monthly"] as PayoutFrequency[]
                ).map((freq) => (
                  <option key={freq} value={freq}>
                    {PAYOUT_FREQUENCY_LABELS[freq]}
                  </option>
                ))}
              </select>
            </label>

            {prefs.frequency === "monthly" ? (
              <label className="block">
                <span className="text-sm font-medium text-zinc-700">
                  Monthly payout day
                </span>
                <select
                  value={prefs.monthlyDay}
                  disabled={locked}
                  onChange={(e) => {
                    setPrefs((p) =>
                      p ? { ...p, monthlyDay: Number(e.target.value) } : p,
                    );
                    setSaved(false);
                  }}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-500"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <div className="block">
              <span className="text-sm font-medium text-zinc-700">
                Next estimated payout
              </span>
              <p className="mt-1.5 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5 text-sm font-semibold text-zinc-900">
                {prefs.nextEstimatedPayout
                  ? formatFinanceShortDate(prefs.nextEstimatedPayout)
                  : "—"}
              </p>
            </div>
          </div>

          {!locked && helperText ? (
            <p className="mt-4 text-sm text-teal-700/90">{helperText}</p>
          ) : null}
        </FinanceSection>

        {!locked ? (
          <FinanceButton type="submit">Save payout preferences</FinanceButton>
        ) : null}
      </form>
    </div>
  );
}
