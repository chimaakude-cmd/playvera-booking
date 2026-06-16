import { saveBooking } from "@/lib/bookings";
import { pendingPayloadToBooking } from "@/lib/booking-checkout/client-confirm";
import type { PendingBookingPayload } from "@/lib/booking-checkout/server-store";
import { syncDetailsToChildProfile } from "@/lib/booking-flow/sync-child";
import { incrementSessionBookings } from "@/lib/sessions";

export function finalizeBookingOnClient(payload: PendingBookingPayload) {
  if (payload.childId) {
    syncDetailsToChildProfile(payload.childId, {
      parentName: payload.parentName,
      email: payload.email,
      childId: payload.childId,
      childName: payload.childName,
      childAge: String(payload.childAge),
      medicalConditions: payload.medicalConditions,
      allergies: payload.allergies,
      medicationRequired: payload.medicationNotes === "yes" ? "yes" : "no",
      emergencyContactName: payload.emergencyContactName,
      emergencyContactPhone: payload.emergencyContactPhone,
      photoConsentSession:
        payload.photoConsentSession === true
          ? "yes"
          : payload.photoConsentSession === false
            ? "no"
            : "",
      photoConsentMarketing:
        payload.photoConsentMarketing === true
          ? "yes"
          : payload.photoConsentMarketing === false
            ? "no"
            : "",
      authorizedCollectionPerson: payload.authorizedCollectionPerson,
    });
  }

  const booking = saveBooking(pendingPayloadToBooking(payload));
  incrementSessionBookings(payload.sessionId);
  return booking;
}
