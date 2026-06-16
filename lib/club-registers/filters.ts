import type { Booking, BookingStatus } from "@/lib/bookings";
import type { CustomerPaymentStatus } from "@/lib/club-customers";

export type RegisterDateStatus = {
  bookingStatus: BookingStatus;
  paymentStatus: CustomerPaymentStatus;
};

/**
 * Hide a child on the register for a given session date when fully cancelled
 * or fully refunded. Partial refunds and active bookings remain visible.
 */
export function isFullyExcludedFromRegister(status: RegisterDateStatus): boolean {
  if (status.bookingStatus === "cancelled") {
    return true;
  }
  if (status.paymentStatus === "refunded") {
    return true;
  }
  return false;
}

export function isIncludedOnRegister(status: RegisterDateStatus): boolean {
  return !isFullyExcludedFromRegister(status);
}

export function mapBookingPaymentStatus(booking: Booking): CustomerPaymentStatus {
  if (booking.status === "refund_requested") return "refund_requested";
  if (booking.status === "cancelled") return "refunded";
  if (booking.status === "pending") return "pending";
  return "paid";
}

export function mapBookingToRegisterDateStatus(booking: Booking): RegisterDateStatus {
  return {
    bookingStatus: booking.status,
    paymentStatus: mapBookingPaymentStatus(booking),
  };
}

export function shouldShowChildOnRegister(booking: Booking): boolean {
  return isIncludedOnRegister(mapBookingToRegisterDateStatus(booking));
}

export function filterRegisterBookings(bookings: Booking[]): Booking[] {
  return bookings.filter(shouldShowChildOnRegister);
}
