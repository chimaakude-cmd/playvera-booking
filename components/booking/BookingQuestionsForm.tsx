"use client";

import type { BookingQuestionConfig } from "@/lib/booking-questions";

type BookingQuestionsFormProps = {
  questions: BookingQuestionConfig[];
  values: Record<string, string | boolean>;
  errors: Record<string, string>;
  onChange: (key: string, value: string | boolean) => void;
};

const inputClassName =
  "mt-1 w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200";

export function BookingQuestionsForm({
  questions,
  values,
  errors,
  onChange,
}: BookingQuestionsFormProps) {
  if (questions.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5">
      <div>
        <h2 className="text-base font-semibold text-zinc-900">
          Booking questions
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Please answer the questions below so the club can run the session safely.
        </p>
      </div>

      {questions.map((question) => (
        <label key={question.id} className="block text-sm">
          <span className="font-medium text-zinc-700">
            {question.label}
            {question.required ? (
              <span className="text-rose-500"> *</span>
            ) : null}
          </span>

          {question.answerType === "long_text" ? (
            <textarea
              value={String(values[question.key] ?? "")}
              onChange={(e) => onChange(question.key, e.target.value)}
              rows={3}
              className={`${inputClassName} ${errors[question.key] ? "border-rose-300" : ""}`}
            />
          ) : question.answerType === "yes_no" ? (
            <select
              value={String(values[question.key] ?? "")}
              onChange={(e) => onChange(question.key, e.target.value)}
              className={`${inputClassName} ${errors[question.key] ? "border-rose-300" : ""}`}
            >
              <option value="">Select…</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          ) : question.answerType === "multiple_choice" ? (
            <select
              value={String(values[question.key] ?? "")}
              onChange={(e) => onChange(question.key, e.target.value)}
              className={`${inputClassName} ${errors[question.key] ? "border-rose-300" : ""}`}
            >
              <option value="">Select…</option>
              {(question.choices ?? []).map((choice) => (
                <option key={choice} value={choice}>
                  {choice}
                </option>
              ))}
            </select>
          ) : question.answerType === "checkbox" ? (
            <label className="mt-2 flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={values[question.key] === true}
                onChange={(e) => onChange(question.key, e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300"
              />
              Yes
            </label>
          ) : (
            <input
              type="text"
              value={String(values[question.key] ?? "")}
              onChange={(e) => onChange(question.key, e.target.value)}
              className={`${inputClassName} ${errors[question.key] ? "border-rose-300" : ""}`}
            />
          )}

          {errors[question.key] ? (
            <p className="mt-1 text-xs text-rose-600">{errors[question.key]}</p>
          ) : null}
        </label>
      ))}
    </section>
  );
}
