import type { BookingQuestionAnswer } from "./types";
import type { BookingQuestionConfig } from "./types";
import { createDefaultBookingQuestions } from "./defaults";
import type { ClubSession } from "@/lib/sessions";

export function getSessionBookingQuestions(
  session: ClubSession,
): BookingQuestionConfig[] {
  if (session.bookingQuestions?.length) {
    return session.bookingQuestions.filter((q) => q.enabled);
  }
  return createDefaultBookingQuestions().filter((q) => q.enabled);
}

export function buildBookingAnswersFromForm(
  questions: BookingQuestionConfig[],
  values: Record<string, string | boolean>,
): BookingQuestionAnswer[] {
  return questions.map((question) => ({
    questionId: question.id,
    key: question.key,
    label: question.label,
    value: values[question.key] ?? "",
    showOnRegister: question.showOnRegister,
  }));
}

export function extractMedicalFromAnswers(
  answers: BookingQuestionAnswer[],
): {
  medicalConditions: string;
  allergies: string;
  medicationNotes: string;
  photoConsentSession: boolean | null;
  photoConsentMarketing: boolean | null;
} {
  const getText = (key: string) =>
    String(answers.find((a) => a.key === key)?.value ?? "");

  const photoSession = answers.find((a) => a.key === "photo_consent_session");
  const photoMarketing = answers.find((a) => a.key === "photo_consent_marketing");

  return {
    medicalConditions: getText("medical_conditions"),
    allergies: getText("allergies"),
    medicationNotes: getText("medication"),
    photoConsentSession:
      typeof photoSession?.value === "boolean"
        ? photoSession.value
        : photoSession?.value === "yes"
          ? true
          : photoSession?.value === "no"
            ? false
            : null,
    photoConsentMarketing:
      typeof photoMarketing?.value === "boolean"
        ? photoMarketing.value
        : photoMarketing?.value === "yes"
          ? true
          : photoMarketing?.value === "no"
            ? false
            : null,
  };
}
