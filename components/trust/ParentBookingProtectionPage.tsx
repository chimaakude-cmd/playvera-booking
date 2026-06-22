"use client";

import Link from "next/link";
import {
  TrustLegalPageLayout,
  TrustLegalSection,
} from "@/components/trust/TrustLegalPageLayout";

export function ParentBookingProtectionPage() {
  return (
    <TrustLegalPageLayout
      eyebrow="Parents"
      title="Booking Protection"
      subtitle="What happens when sessions are cancelled, rescheduled or fully booked."
    >
      <TrustLegalSection id="cancelled" title="Provider cancellations">
        <p>
          If a provider cancels a session, you should receive notification by
          email and in your Activora account. Refunds or credits are handled
          according to the provider&apos;s policy — most offer a full refund or
          transfer to another date.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="reschedules" title="Reschedules">
        <p>
          Providers may offer free rescheduling within a defined window (for
          example, 24 hours before the session). Check your booking confirmation
          for the specific rules. If you need to change dates, use the options in
          My Bookings or contact the provider.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="waiting-lists" title="Waiting lists">
        <p>
          When a session is full, you can join the waiting list where enabled.
          If a place becomes available, you will be notified to complete booking
          within a limited time. Waiting list positions are managed by the
          provider&apos;s settings.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="weather" title="Weather and unforeseen events">
        <p>
          Outdoor activities may be cancelled for safety. Providers should
          communicate alternatives or refunds promptly. Keep notification preferences
          up to date in your profile.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="help" title="Need help?">
        <p>
          Visit the{" "}
          <Link href="/help/faq" className="font-semibold text-teal-700 dark:text-teal-400">
            Help centre
          </Link>{" "}
          or{" "}
          <Link href="/contact" className="font-semibold text-teal-700 dark:text-teal-400">
            contact support
          </Link>{" "}
          if a booking issue is not resolved by your provider.
        </p>
      </TrustLegalSection>
    </TrustLegalPageLayout>
  );
}
