"use client";

import { useEffect, useState } from "react";
import {
  BOOKING_QUESTION_CATEGORY_LABELS,
  type AdminBookingQuestion,
  type BookingQuestionCategory,
} from "@/lib/admin-booking-questions";
import { invalidatePlatformPublicSettingsCache } from "@/lib/platform-settings/client-cache";
import type { PlatformSettingsPayload } from "@/lib/platform-settings/types";

const ANSWER_TYPES = [
  { value: "short_text", label: "Short text" },
  { value: "long_text", label: "Long text" },
  { value: "yes_no", label: "Yes / No" },
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "checkbox", label: "Checkbox" },
] as const;

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

export function BookingQuestionsSettings() {
  const [questions, setQuestions] = useState<AdminBookingQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const settings = await fetchPlatformSettings();
        if (!cancelled) {
          setQuestions(settings.bookingQuestionDefaults);
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

  function moveQuestion(id: string, direction: -1 | 1) {
    const index = questions.findIndex((q) => q.id === id);
    if (index < 0) {
      return;
    }
    const target = index + direction;
    if (target < 0 || target >= questions.length) {
      return;
    }
    const next = [...questions];
    [next[index], next[target]] = [next[target], next[index]];
    setQuestions(next.map((question, sortIndex) => ({
      ...question,
      sortOrder: sortIndex + 1,
    })));
    setSaved(false);
    setError(null);
  }

  function updateQuestion(id: string, patch: Partial<AdminBookingQuestion>) {
    setQuestions((current) =>
      current.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    );
    setSaved(false);
    setError(null);
  }

  function handleAdd() {
    const next: AdminBookingQuestion = {
      id: `admin-custom_${Date.now()}`,
      key: `custom_${Date.now()}`,
      label: "New question",
      category: "SESSION",
      answerType: "short_text",
      required: false,
      showOnRegister: true,
      enabled: true,
      sortOrder: questions.length + 1,
    };
    setQuestions((current) => [...current, next]);
    setSaved(false);
    setError(null);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const response = await fetch("/api/admin/platform-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingQuestionDefaults: questions }),
      });

      if (!response.ok) {
        throw new Error("Save failed");
      }

      const data = (await response.json()) as { settings: PlatformSettingsPayload };
      setQuestions(data.settings.bookingQuestionDefaults);
      invalidatePlatformPublicSettingsCache();
      setSaved(true);
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
      setQuestions(data.settings.bookingQuestionDefaults);
      invalidatePlatformPublicSettingsCache();
      setSaved(true);
    } catch {
      setError("Unable to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">
            Default booking questions
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Platform defaults clubs inherit.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleAdd}
            disabled={loading || saving}
            className="rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50 disabled:opacity-60"
          >
            Add question
          </button>
          <button
            type="button"
            onClick={() => void handleReset()}
            disabled={loading || saving}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-60"
          >
            Reset defaults
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading booking questions…</p>
      ) : null}

      <div className="space-y-2">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className={`rounded-xl border p-4 ${
              question.enabled
                ? "border-violet-200 bg-violet-50/30"
                : "border-zinc-200 bg-white opacity-75"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {editingId === question.id ? (
                  <input
                    value={question.label}
                    onChange={(e) =>
                      updateQuestion(question.id, { label: e.target.value })
                    }
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  />
                ) : (
                  <p className="text-sm font-medium text-zinc-900">
                    {question.label}
                  </p>
                )}
                <p className="mt-1 text-xs text-zinc-500">
                  {BOOKING_QUESTION_CATEGORY_LABELS[question.category]} ·{" "}
                  {question.key}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={index === 0 || loading || saving}
                  onClick={() => moveQuestion(question.id, -1)}
                  className="rounded border border-zinc-200 px-2 py-1 text-xs disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={index === questions.length - 1 || loading || saving}
                  onClick={() => moveQuestion(question.id, 1)}
                  className="rounded border border-zinc-200 px-2 py-1 text-xs disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEditingId(editingId === question.id ? null : question.id)
                  }
                  className="text-xs font-semibold text-violet-700"
                >
                  Edit
                </button>
              </div>
            </div>

            {editingId === question.id ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className="block text-xs font-medium text-zinc-600">
                  Category
                  <select
                    value={question.category}
                    onChange={(e) =>
                      updateQuestion(question.id, {
                        category: e.target.value as BookingQuestionCategory,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                  >
                    {Object.entries(BOOKING_QUESTION_CATEGORY_LABELS).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <label className="block text-xs font-medium text-zinc-600">
                  Answer type
                  <select
                    value={question.answerType}
                    onChange={(e) =>
                      updateQuestion(question.id, {
                        answerType: e.target.value as AdminBookingQuestion["answerType"],
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                  >
                    {ANSWER_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex flex-col gap-2 pt-5 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={question.enabled}
                      onChange={(e) =>
                        updateQuestion(question.id, { enabled: e.target.checked })
                      }
                    />
                    Enabled
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={question.required}
                      onChange={(e) =>
                        updateQuestion(question.id, { required: e.target.checked })
                      }
                    />
                    Required
                  </label>
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 border-t border-zinc-100 pt-4">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={loading || saving}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save questions"}
        </button>
        {saved ? (
          <span className="text-sm text-emerald-600">
            Settings saved successfully.
          </span>
        ) : null}
        {error ? (
          <span className="text-sm text-red-600">{error}</span>
        ) : null}
      </div>
    </div>
  );
}
