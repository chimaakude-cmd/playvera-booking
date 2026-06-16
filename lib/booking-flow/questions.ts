import type { BookingQuestionConfig } from "@/lib/booking-questions";
import { DETAILS_STEP_QUESTION_KEYS } from "./constants";

export function getSessionSpecificQuestions(
  questions: BookingQuestionConfig[],
): BookingQuestionConfig[] {
  return questions.filter((q) => !DETAILS_STEP_QUESTION_KEYS.has(q.key));
}

export function validateRequiredQuestions(
  questions: BookingQuestionConfig[],
  values: Record<string, string | boolean>,
): Record<string, string> {
  const errors: Record<string, string> = {};

  questions.forEach((question) => {
    if (!question.required) {
      return;
    }
    const value = values[question.key];
    if (
      value === undefined ||
      value === "" ||
      (question.answerType === "checkbox" && value !== true)
    ) {
      errors[question.key] = "This question is required";
    }
  });

  return errors;
}
