"use client";

import { useState } from "react";
import { BookingQuestionsForm } from "./BookingQuestionsForm";
import type { BookingQuestionConfig } from "@/lib/booking-questions";
import { validateRequiredQuestions } from "@/lib/booking-flow/questions";

type BookingQuestionsStepProps = {
  questions: BookingQuestionConfig[];
  values: Record<string, string | boolean>;
  onChange: (values: Record<string, string | boolean>) => void;
  onContinue: () => void;
  onBack: () => void;
};

export function BookingQuestionsStep({
  questions,
  values,
  onChange,
  onContinue,
  onBack,
}: BookingQuestionsStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  function updateQuestion(key: string, value: string | boolean) {
    onChange({ ...values, [key]: value });
    setErrors((current) => ({ ...current, [key]: "" }));
    setFormError("");
  }

  function handleContinue() {
    const nextErrors = validateRequiredQuestions(questions, values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setFormError("Please answer all required questions.");
      return;
    }
    onContinue();
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#0F172A]">Booking questions</h2>
        <p className="mt-1 text-sm text-slate-600">
          Answer any extra questions from the provider for this session.
        </p>
      </div>

      {questions.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
          No additional questions for this session.
        </p>
      ) : (
        <BookingQuestionsForm
          questions={questions}
          values={values}
          errors={errors}
          onChange={updateQuestion}
        />
      )}

      {formError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          className="rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Continue to checkout
        </button>
      </div>
    </div>
  );
}
