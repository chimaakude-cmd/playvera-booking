import type { BookingQuestionAnswerType } from "../booking-questions/types";

export const ADMIN_BOOKING_QUESTIONS_KEY = "activora-admin-booking-questions";

export type BookingQuestionCategory =
  | "CHILD"
  | "CONTACT"
  | "MEDICAL"
  | "CONSENT"
  | "SESSION";

export type AdminBookingQuestion = {
  id: string;
  key: string;
  label: string;
  category: BookingQuestionCategory;
  answerType: BookingQuestionAnswerType;
  required: boolean;
  showOnRegister: boolean;
  enabled: boolean;
  sortOrder: number;
};

export const BOOKING_QUESTION_CATEGORY_LABELS: Record<
  BookingQuestionCategory,
  string
> = {
  CHILD: "Child",
  CONTACT: "Contact",
  MEDICAL: "Medical",
  CONSENT: "Consent",
  SESSION: "Session",
};

function q(
  key: string,
  label: string,
  category: BookingQuestionCategory,
  answerType: AdminBookingQuestion["answerType"],
  overrides: Partial<AdminBookingQuestion> = {},
): AdminBookingQuestion {
  return {
    id: `admin-${key}`,
    key,
    label,
    category,
    answerType,
    required: false,
    showOnRegister: true,
    enabled: true,
    sortOrder: 0,
    ...overrides,
  };
}

export const SEED_ADMIN_BOOKING_QUESTIONS: AdminBookingQuestion[] = [
  q("child_first_name", "Child first name", "CHILD", "short_text", {
    required: true,
    sortOrder: 1,
  }),
  q("child_last_name", "Child last name", "CHILD", "short_text", {
    required: true,
    sortOrder: 2,
  }),
  q("child_date_of_birth", "Child date of birth", "CHILD", "short_text", {
    required: true,
    sortOrder: 3,
  }),
  q("medical_conditions", "Does your child have any medical conditions?", "MEDICAL", "long_text", {
    required: true,
    sortOrder: 10,
  }),
  q("allergies", "Does your child have any allergies?", "MEDICAL", "long_text", {
    required: true,
    sortOrder: 11,
  }),
  q(
    "medication",
    "Does your child require medication during the session?",
    "MEDICAL",
    "yes_no",
    { sortOrder: 12 },
  ),
  q("additional_needs", "Does your child have any additional needs?", "MEDICAL", "long_text", {
    sortOrder: 13,
  }),
  q("emergency_contact_name", "Emergency contact name", "CONTACT", "short_text", {
    required: true,
    sortOrder: 20,
  }),
  q("emergency_contact_number", "Emergency contact number", "CONTACT", "short_text", {
    required: true,
    sortOrder: 21,
  }),
  q(
    "collection_authorised",
    "Who is authorised to collect your child?",
    "CONTACT",
    "short_text",
    { sortOrder: 22 },
  ),
  q(
    "photo_consent_session",
    "Is your child allowed to be photographed/videoed?",
    "CONSENT",
    "yes_no",
    { required: true, sortOrder: 30 },
  ),
  q(
    "photo_consent_marketing",
    "Can we use photos/videos for marketing?",
    "CONSENT",
    "yes_no",
    { showOnRegister: false, sortOrder: 31 },
  ),
  q(
    "swimming_ability",
    "Swimming ability (if applicable)",
    "SESSION",
    "short_text",
    { enabled: false, sortOrder: 40 },
  ),
  q("anything_else", "Anything else we should know?", "SESSION", "long_text", {
    sortOrder: 41,
  }),
].map((question, index) => ({ ...question, sortOrder: question.sortOrder || index + 1 }));
