import type { BookingQuestionConfig } from "./types";

function q(
  key: string,
  label: string,
  answerType: BookingQuestionConfig["answerType"],
  overrides: Partial<BookingQuestionConfig> = {},
): BookingQuestionConfig {
  return {
    id: `std-${key}`,
    key,
    label,
    answerType,
    required: false,
    showOnRegister: true,
    enabled: false,
    isCustom: false,
    ...overrides,
  };
}

export const STANDARD_BOOKING_QUESTIONS: BookingQuestionConfig[] = [
  q("medical_conditions", "Does your child have any medical conditions?", "long_text", {
    enabled: true,
    required: true,
    showOnRegister: true,
  }),
  q("allergies", "Does your child have any allergies?", "long_text", {
    enabled: true,
    required: true,
    showOnRegister: true,
  }),
  q(
    "medication",
    "Does your child require medication during the session?",
    "yes_no",
    { enabled: true, showOnRegister: true },
  ),
  q("emergency_contact_name", "Emergency contact name", "short_text", {
    enabled: true,
    required: true,
    showOnRegister: true,
  }),
  q("emergency_contact_number", "Emergency contact number", "short_text", {
    enabled: true,
    required: true,
    showOnRegister: true,
  }),
  q(
    "additional_needs",
    "Does your child have any additional needs?",
    "long_text",
    { showOnRegister: true },
  ),
  q(
    "photo_consent_session",
    "Is your child allowed to be photographed/videoed?",
    "yes_no",
    { enabled: true, required: true, showOnRegister: true },
  ),
  q(
    "photo_consent_marketing",
    "Can we use photos/videos for marketing?",
    "yes_no",
    { showOnRegister: false },
  ),
  q(
    "collection_authorised",
    "Who is authorised to collect your child?",
    "short_text",
    { enabled: true, showOnRegister: true },
  ),
  q("anything_else", "Anything else we should know?", "long_text", {
    showOnRegister: true,
  }),
];

export function createDefaultBookingQuestions(): BookingQuestionConfig[] {
  return STANDARD_BOOKING_QUESTIONS.map((question) => ({ ...question }));
}

export function createEmptyCustomQuestion(): BookingQuestionConfig {
  return {
    id: `custom-${crypto.randomUUID()}`,
    key: `custom_${Date.now()}`,
    label: "",
    answerType: "short_text",
    required: false,
    showOnRegister: true,
    enabled: true,
    isCustom: true,
  };
}
