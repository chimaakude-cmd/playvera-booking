import type { PendingBookingPayload } from "./server-store";
import type { NewBooking } from "@/lib/bookings";

export function pendingPayloadToBooking(
  payload: PendingBookingPayload,
): NewBooking {
  return {
    sessionId: payload.sessionId,
    sessionTitle: payload.sessionTitle,
    providerName: payload.providerName,
    day: payload.day,
    startTime: payload.startTime,
    endTime: payload.endTime,
    pricePaid: payload.pricePaid,
    parentName: payload.parentName,
    email: payload.email,
    childName: payload.childName,
    childAge: payload.childAge,
    childId: payload.childId,
    emergencyContact: payload.emergencyContact,
    emergencyContactName: payload.emergencyContactName,
    emergencyContactPhone: payload.emergencyContactPhone,
    authorizedCollectionPerson: payload.authorizedCollectionPerson,
    status: "confirmed",
    bookingAnswers: payload.bookingAnswers,
    medicalConditions: payload.medicalConditions,
    allergies: payload.allergies,
    medicationNotes: payload.medicationNotes,
    photoConsentSession: payload.photoConsentSession,
    photoConsentMarketing: payload.photoConsentMarketing,
    accessMode: payload.accessMode,
  };
}
