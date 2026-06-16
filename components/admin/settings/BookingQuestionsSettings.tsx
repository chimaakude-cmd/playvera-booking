"use client";

import { useEffect, useState } from "react";
import {
  addAdminBookingQuestion,
  BOOKING_QUESTION_CATEGORY_LABELS,
  getAdminBookingQuestions,
  reorderAdminBookingQuestions,
  resetAdminBookingQuestions,
  saveAdminBookingQuestions,
  type AdminBookingQuestion,
  type BookingQuestionCategory,
} from "@/lib/admin-booking-questions";

const ANSWER_TYPES = [
  { value: "short_text", label: "Short text" },
  { value: "long_text", label: "Long text" },
  { value: "yes_no", label: "Yes / No" },
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "checkbox", label: "Checkbox" },
] as const;

export function BookingQuestionsSettings() {
  const [questions, setQuestions] = useState<AdminBookingQuestion[]>([]);
  const [saved, setSaved] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setQuestions(getAdminBookingQuestions());
  }, []);

  function refresh() {
    setQuestions(getAdminBookingQuestions());
    setSaved(false);
  }

  function handleSave() {
    saveAdminBookingQuestions(questions);
    setSaved(true);
  }

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
    reorderAdminBookingQuestions(next.map((q) => q.id));
    refresh();
  }

  function updateQuestion(id: string, patch: Partial<AdminBookingQuestion>) {
    setQuestions((current) =>
      current.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    );
    setSaved(false);
  }

  function handleAdd() {
    addAdminBookingQuestion({
      key: `custom_${Date.now()}`,
      label: "New question",
      category: "SESSION",
      answerType: "short_text",
      required: false,
      showOnRegister: true,
      enabled: true,
    });
    refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">
            Default booking questions
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Platform defaults clubs inherit. Stored in{" "}
            <code className="text-[10px]">activora-admin-booking-questions</code>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleAdd}
            className="rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50"
          >
            Add question
          </button>
          <button
            type="button"
            onClick={() => {
              resetAdminBookingQuestions();
              refresh();
            }}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          >
            Reset defaults
          </button>
        </div>
      </div>

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
                  disabled={index === 0}
                  onClick={() => moveQuestion(question.id, -1)}
                  className="rounded border border-zinc-200 px-2 py-1 text-xs disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={index === questions.length - 1}
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
          onClick={handleSave}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Save questions
        </button>
        {saved ? (
          <span className="text-sm text-emerald-600">Saved locally.</span>
        ) : null}
      </div>
    </div>
  );
}
