"use client";

import { useState } from "react";
import {
  getClubReviewSettings,
  saveClubReviewSettings,
  INCENTIVE_OPTIONS,
  REQUEST_DELAY_OPTIONS,
  REMINDER_OPTIONS,
  type ClubReviewSettings,
} from "@/lib/reviews";

type ReviewRequestSettingsProps = {
  canEdit?: boolean;
};

export function ReviewRequestSettings({ canEdit = true }: ReviewRequestSettingsProps) {
  const [settings, setSettings] = useState<ClubReviewSettings>(getClubReviewSettings);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof ClubReviewSettings>(
    key: K,
    value: ClubReviewSettings[K],
  ) {
    setSettings((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    saveClubReviewSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
        <strong>Important:</strong> Do NOT tie review score to reward. Reward only
        for leaving a review — never for a specific star rating.
      </div>

      <div className="space-y-4">
        <label className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3">
          <div>
            <p className="text-sm font-medium text-zinc-900">Encourage reviews</p>
            <p className="text-xs text-zinc-500">
              Show incentives and request verified feedback from parents
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.encourageReviews}
            disabled={!canEdit}
            onChange={(e) => update("encourageReviews", e.target.checked)}
            className="h-5 w-5 rounded border-zinc-300"
          />
        </label>

        <div>
          <label
            htmlFor="incentive-type"
            className="text-sm font-medium text-zinc-700"
          >
            Incentive type
          </label>
          <select
            id="incentive-type"
            value={settings.incentiveType}
            disabled={!canEdit || !settings.encourageReviews}
            onChange={(e) =>
              update(
                "incentiveType",
                e.target.value as ClubReviewSettings["incentiveType"],
              )
            }
            className="mt-1.5 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm disabled:opacity-50"
          >
            {INCENTIVE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border-t border-zinc-100 pt-6">
        <h3 className="text-sm font-semibold text-zinc-900">Review requests</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Automatically email parents after attendance is marked
        </p>

        <div className="mt-4 space-y-4">
          <label className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-900">Auto request</p>
              <p className="text-xs text-zinc-500">
                Schedule review request emails automatically
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoRequestEnabled}
              disabled={!canEdit}
              onChange={(e) => update("autoRequestEnabled", e.target.checked)}
              className="h-5 w-5 rounded border-zinc-300"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="request-delay"
                className="text-sm font-medium text-zinc-700"
              >
                Send delay
              </label>
              <select
                id="request-delay"
                value={settings.requestDelay}
                disabled={!canEdit || !settings.autoRequestEnabled}
                onChange={(e) =>
                  update(
                    "requestDelay",
                    e.target.value as ClubReviewSettings["requestDelay"],
                  )
                }
                className="mt-1.5 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm disabled:opacity-50"
              >
                {REQUEST_DELAY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="reminder-days"
                className="text-sm font-medium text-zinc-700"
              >
                Reminder
              </label>
              <select
                id="reminder-days"
                value={settings.reminderDays ?? ""}
                disabled={!canEdit || !settings.autoRequestEnabled}
                onChange={(e) => {
                  const val = e.target.value;
                  update(
                    "reminderDays",
                    val === "" ? null : (Number(val) as 3 | 7),
                  );
                }}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm disabled:opacity-50"
              >
                {REMINDER_OPTIONS.map((option) => (
                  <option
                    key={String(option.value)}
                    value={option.value ?? ""}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {canEdit ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Save review settings
          </button>
          {saved ? (
            <span className="text-sm text-teal-700">Settings saved</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
