export const BOOKING_FLOW_STEPS = [
  { step: 1, label: "Access", percent: 25 },
  { step: 2, label: "Details", percent: 50 },
  { step: 3, label: "Review", percent: 75 },
  { step: 4, label: "Checkout", percent: 100 },
] as const;

export const WAITLIST_FLOW_STEPS = [
  { step: 1, label: "Access", percent: 25 },
  { step: 2, label: "Details", percent: 50 },
  { step: 3, label: "Review", percent: 75 },
  { step: 4, label: "Confirmation", percent: 100 },
] as const;

/** Standard questions captured in the Details step — excluded from Questions step. */
export const DETAILS_STEP_QUESTION_KEYS = new Set([
  "medical_conditions",
  "allergies",
  "medication",
  "emergency_contact_name",
  "emergency_contact_number",
  "photo_consent_session",
  "photo_consent_marketing",
  "collection_authorised",
]);

export const BOOKING_DRAFT_STORAGE_PREFIX = "activora-booking-draft-";
