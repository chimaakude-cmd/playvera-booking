"use client";

import {
  createEmptyCustomQuestion,
  type BookingQuestionAnswerType,
  type BookingQuestionConfig,
} from "@/lib/booking-questions";
import { WizardFormData } from "@/lib/session-wizard";
import { StepSection, WizardField, wizardInputClassName } from "./shared";

type BookingQuestionsStepProps = {
  data: WizardFormData;
  onChange: (updates: Partial<WizardFormData>) => void;
};

const ANSWER_TYPE_LABELS: Record<BookingQuestionAnswerType, string> = {
  short_text: "Short text",
  long_text: "Long text",
  yes_no: "Yes / No",
  multiple_choice: "Multiple choice",
  checkbox: "Checkbox",
};

function updateQuestion(
  questions: BookingQuestionConfig[],
  id: string,
  patch: Partial<BookingQuestionConfig>,
): BookingQuestionConfig[] {
  return questions.map((q) => (q.id === id ? { ...q, ...patch } : q));
}

export function BookingQuestionsStep({
  data,
  onChange,
}: BookingQuestionsStepProps) {
  const standard = data.bookingQuestions.filter((q) => !q.isCustom);
  const custom = data.bookingQuestions.filter((q) => q.isCustom);

  function setQuestions(next: BookingQuestionConfig[]) {
    onChange({ bookingQuestions: next });
  }

  function renderQuestionCard(question: BookingQuestionConfig) {
    return (
      <div
        key={question.id}
        className={`rounded-2xl border p-4 ${
          question.enabled
            ? "border-teal-200 bg-teal-50/40"
            : "border-zinc-200 bg-white"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-900">
            <input
              type="checkbox"
              checked={question.enabled}
              onChange={(e) =>
                setQuestions(
                  updateQuestion(data.bookingQuestions, question.id, {
                    enabled: e.target.checked,
                  }),
                )
              }
              className="h-4 w-4 rounded border-zinc-300 text-teal-600"
            />
            {question.isCustom ? "Custom question" : "Include question"}
          </label>
          {question.isCustom ? (
            <button
              type="button"
              onClick={() =>
                setQuestions(
                  data.bookingQuestions.filter((q) => q.id !== question.id),
                )
              }
              className="text-xs font-medium text-rose-600 hover:text-rose-800"
            >
              Remove
            </button>
          ) : null}
        </div>

        {question.enabled ? (
          <div className="mt-4 space-y-3">
            {question.isCustom ? (
              <WizardField label="Question text" htmlFor={`q-${question.id}`}>
                <input
                  id={`q-${question.id}`}
                  value={question.label}
                  onChange={(e) =>
                    setQuestions(
                      updateQuestion(data.bookingQuestions, question.id, {
                        label: e.target.value,
                      }),
                    )
                  }
                  className={wizardInputClassName}
                  placeholder="e.g. Does your child swim confidently?"
                />
              </WizardField>
            ) : (
              <p className="text-sm font-medium text-zinc-800">{question.label}</p>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-xs font-medium text-zinc-600">
                Answer type
                <select
                  value={question.answerType}
                  onChange={(e) =>
                    setQuestions(
                      updateQuestion(data.bookingQuestions, question.id, {
                        answerType: e.target.value as BookingQuestionAnswerType,
                      }),
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                >
                  {Object.entries(ANSWER_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-end gap-2 pb-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={question.required}
                  onChange={(e) =>
                    setQuestions(
                      updateQuestion(data.bookingQuestions, question.id, {
                        required: e.target.checked,
                      }),
                    )
                  }
                  className="h-4 w-4 rounded border-zinc-300 text-teal-600"
                />
                Required
              </label>

              <label className="flex items-end gap-2 pb-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={question.showOnRegister}
                  onChange={(e) =>
                    setQuestions(
                      updateQuestion(data.bookingQuestions, question.id, {
                        showOnRegister: e.target.checked,
                      }),
                    )
                  }
                  className="h-4 w-4 rounded border-zinc-300 text-teal-600"
                />
                Show on register
              </label>
            </div>

            {question.answerType === "multiple_choice" ? (
              <WizardField label="Choices (one per line)" htmlFor={`choices-${question.id}`}>
                <textarea
                  id={`choices-${question.id}`}
                  value={(question.choices ?? []).join("\n")}
                  onChange={(e) =>
                    setQuestions(
                      updateQuestion(data.bookingQuestions, question.id, {
                        choices: e.target.value
                          .split("\n")
                          .map((line) => line.trim())
                          .filter(Boolean),
                      }),
                    )
                  }
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  placeholder="Beginner&#10;Intermediate&#10;Advanced"
                />
              </WizardField>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <StepSection
      title="Booking questions"
      description="Choose what parents must answer when booking. Answers marked “show on register” appear on the session register for coaches."
    >
      <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Please be careful when creating custom questions. Do not request
        unnecessary sensitive information. Only ask questions that are relevant
        to safely delivering the session.
      </div>

      <div className="space-y-6">
        <section>
          <h3 className="text-sm font-semibold text-zinc-900">
            Standard questions
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Common safeguarding and consent questions with sensible defaults.
          </p>
          <div className="mt-4 space-y-3">{standard.map(renderQuestionCard)}</div>
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">
                Custom questions
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                Add your own questions for this activity.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setQuestions([
                  ...data.bookingQuestions,
                  createEmptyCustomQuestion(),
                ])
              }
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Add custom question
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {custom.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-500">
                No custom questions yet.
              </p>
            ) : (
              custom.map(renderQuestionCard)
            )}
          </div>
        </section>
      </div>
    </StepSection>
  );
}
