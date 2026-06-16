export type BookingQuestionAnswerType =
  | "short_text"
  | "long_text"
  | "yes_no"
  | "multiple_choice"
  | "checkbox";

export type StandardBookingQuestionKey =
  | "medical_conditions"
  | "allergies"
  | "medication"
  | "emergency_contact_name"
  | "emergency_contact_number"
  | "additional_needs"
  | "photo_consent_session"
  | "photo_consent_marketing"
  | "collection_authorised"
  | "anything_else";

export type BookingQuestionConfig = {
  id: string;
  key: string;
  label: string;
  answerType: BookingQuestionAnswerType;
  required: boolean;
  showOnRegister: boolean;
  enabled: boolean;
  isCustom: boolean;
  choices?: string[];
};

export type BookingQuestionAnswer = {
  questionId: string;
  key: string;
  label: string;
  value: string | boolean;
  showOnRegister: boolean;
};

export type SessionBookingQuestions = {
  questions: BookingQuestionConfig[];
};
