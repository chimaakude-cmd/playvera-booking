"use client";

import { useEffect, useState } from "react";
import {
  createEmptyCustomQuestion,
  type BookingQuestionConfig,
} from "@/lib/booking-questions";
import { getClubDefaultBookingQuestions } from "@/lib/club-onboarding";
import { CLUB_DEFAULT_BOOKING_QUESTIONS_KEY } from "@/lib/club-onboarding/types";
import { adminQuestionsToClubConfig } from "@/lib/admin-booking-questions";
import { hydratePlatformPublicSettings } from "@/lib/platform-settings/client-cache";

function mergeWithAdminDefaults(
  clubQuestions: BookingQuestionConfig[],
): BookingQuestionConfig[] {
  const adminDefaults = adminQuestionsToClubConfig();
  const clubMap = new Map(clubQuestions.map((q) => [q.key, q]));

  const merged = adminDefaults.map((adminQ) => {
    const clubOverride = clubMap.get(adminQ.key);
    return clubOverride ? { ...adminQ, ...clubOverride, isCustom: false } : adminQ;
  });

  const custom = clubQuestions.filter((q) => q.isCustom);
  return [...merged, ...custom];
}

export function ClubBookingQuestionsSettings() {
  const [questions, setQuestions] = useState<BookingQuestionConfig[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      await hydratePlatformPublicSettings();
      if (cancelled) {
        return;
      }
      const clubStored = getClubDefaultBookingQuestions();
      setQuestions(mergeWithAdminDefaults(clubStored));
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function persist(next: BookingQuestionConfig[]) {
    setQuestions(next);
    setSaved(false);
  }

  function handleSave() {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        CLUB_DEFAULT_BOOKING_QUESTIONS_KEY,
        JSON.stringify(questions),
      );
    }
    setSaved(true);
  }

  function updateQuestion(id: string, patch: Partial<BookingQuestionConfig>) {
    persist(
      questions.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    );
  }

  const standard = questions.filter((q) => !q.isCustom);
  const custom = questions.filter((q) => q.isCustom);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Custom questions should be clear and compliant. Only ask what you
        genuinely need for safeguarding and operations.
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-900">
          Platform default questions
        </h3>
        {standard.map((question) => (
          <div
            key={question.id}
            className={`rounded-xl border p-4 ${
              question.enabled
                ? "border-teal-200 bg-teal-50/40"
                : "border-zinc-200 bg-white"
            }`}
          >
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-900">
              <input
                type="checkbox"
                checked={question.enabled}
                onChange={(e) =>
                  updateQuestion(question.id, { enabled: e.target.checked })
                }
                className="h-4 w-4 rounded border-zinc-300 text-teal-600"
              />
              {question.label}
            </label>
            {question.enabled ? (
              <div className="mt-2 flex gap-4 text-xs text-zinc-600">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={question.required}
                    onChange={(e) =>
                      updateQuestion(question.id, { required: e.target.checked })
                    }
                  />
                  Required
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={question.showOnRegister}
                    onChange={(e) =>
                      updateQuestion(question.id, {
                        showOnRegister: e.target.checked,
                      })
                    }
                  />
                  Show on register
                </label>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {custom.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-900">Custom questions</h3>
          {custom.map((question) => (
            <div
              key={question.id}
              className="rounded-xl border border-zinc-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <input
                  value={question.label}
                  onChange={(e) =>
                    updateQuestion(question.id, { label: e.target.value })
                  }
                  placeholder="Question text"
                  className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() =>
                    persist(questions.filter((q) => q.id !== question.id))
                  }
                  className="text-xs font-medium text-rose-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() =>
          persist([...questions, createEmptyCustomQuestion()])
        }
        className="rounded-xl border border-dashed border-teal-300 px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50"
      >
        + Add custom question
      </button>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Save booking questions
        </button>
        {saved ? (
          <span className="text-sm text-emerald-600">Saved locally.</span>
        ) : null}
      </div>
    </div>
  );
}
