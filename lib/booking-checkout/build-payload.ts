import type { BookingQuestionAnswer } from "@/lib/booking-questions";
import {
  buildBookingAnswersFromForm,
  extractMedicalFromAnswers,
} from "@/lib/booking-questions";
import type { BookingQuestionConfig } from "@/lib/booking-questions";
import type { ClubSession } from "@/lib/sessions";
import type { BookingDetailsForm } from "@/lib/booking-flow/types";
import type { PendingBookingPayload } from "./server-store";
import type { StoredCheckoutFeeBreakdown } from "@/lib/stripe/platform-fee";

export function buildDetailsAnswers(
  details: BookingDetailsForm,
): BookingQuestionAnswer[] {
  const entries: Array<{ key: string; label: string; value: string }> = [
    {
      key: "medical_conditions",
      label: "Medical conditions",
      value: details.medicalConditions,
    },
    { key: "allergies", label: "Allergies", value: details.allergies },
    {
      key: "medication",
      label: "Medication required",
      value: details.medicationRequired,
    },
    {
      key: "emergency_contact_name",
      label: "Emergency contact name",
      value: details.emergencyContactName,
    },
    {
      key: "emergency_contact_number",
      label: "Emergency contact number",
      value: details.emergencyContactPhone,
    },
    {
      key: "photo_consent_session",
      label: "Photo/video consent (session)",
      value: details.photoConsentSession,
    },
    {
      key: "photo_consent_marketing",
      label: "Photo/video consent (marketing)",
      value: details.photoConsentMarketing,
    },
    {
      key: "collection_authorised",
      label: "Authorised collection person",
      value: details.authorizedCollectionPerson,
    },
  ];

  return entries.map((entry) => ({
    questionId: `details-${entry.key}`,
    key: entry.key,
    label: entry.label,
    value: entry.value,
    showOnRegister: true,
  }));
}

export function buildPendingBookingPayload(params: {
  session: ClubSession;
  details: BookingDetailsForm;
  sessionQuestions: BookingQuestionConfig[];
  questionValues: Record<string, string | boolean>;
  pricePaid: number;
  accessMode: "guest" | "parent";
  feeBreakdown?: StoredCheckoutFeeBreakdown;
}): PendingBookingPayload {
  const sessionAnswers = buildBookingAnswersFromForm(
    params.sessionQuestions,
    params.questionValues,
  );
  const detailsAnswers = buildDetailsAnswers(params.details);
  const bookingAnswers = [...detailsAnswers, ...sessionAnswers];
  const medical = extractMedicalFromAnswers(bookingAnswers);

  const emergencyContact = [
    params.details.emergencyContactName.trim(),
    params.details.emergencyContactPhone.trim(),
  ]
    .filter(Boolean)
    .join(" — ");

  return {
    sessionId: params.session.id,
    sessionTitle: params.session.sessionTitle,
    providerName: params.session.location || "Activora Club",
    day: params.session.day,
    startTime: params.session.startTime,
    endTime: params.session.endTime,
    pricePaid: params.pricePaid,
    parentName: params.details.parentName.trim(),
    email: params.details.email.trim(),
    childName: params.details.childName.trim(),
    childAge: Number(params.details.childAge),
    childId: params.details.childId,
    emergencyContact,
    emergencyContactName: params.details.emergencyContactName.trim(),
    emergencyContactPhone: params.details.emergencyContactPhone.trim(),
    authorizedCollectionPerson: params.details.authorizedCollectionPerson.trim(),
    bookingAnswers,
    medicalConditions: medical.medicalConditions,
    allergies: medical.allergies,
    medicationNotes: medical.medicationNotes,
    photoConsentSession: medical.photoConsentSession,
    photoConsentMarketing: medical.photoConsentMarketing,
    accessMode: params.accessMode,
    platformFeePercent: params.feeBreakdown?.platformFeePercent,
    platformFee: params.feeBreakdown?.platformFee,
    applicationFeePence: params.feeBreakdown?.applicationFeePence,
    platformFeeSource: params.feeBreakdown?.platformFeeSource,
    estimatedStripeFee: params.feeBreakdown?.estimatedStripeFee,
    estimatedProviderPayout: params.feeBreakdown?.estimatedProviderPayout,
    feeHandling: params.feeBreakdown?.feeHandling,
  };
}
