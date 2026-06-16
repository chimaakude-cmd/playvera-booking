"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LoadingState } from "@/components/club/LoadingState";
import { Logo } from "@/components/branding";
import { PoweredByActivoraFooter } from "@/components/PoweredByActivoraFooter";
import { saveBooking } from "@/lib/bookings";
import { calculateVatBreakdown } from "@/lib/club-finance/vat";
import { getFeeSettings } from "@/lib/fee-settings";
import { calculatePaymentBreakdown } from "@/lib/payments";
import { getSessionById, incrementSessionBookings } from "@/lib/sessions";
import {
  upsertWaitlistEntriesFromServer,
  updateWaitlistEntry,
} from "@/lib/waitlist/storage";
import type { WaitlistEntry } from "@/lib/waitlist/types";

function InviteBookingContent() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [error, setError] = useState("");

  useEffect(() => {
    async function redeemInvite() {
      try {
        const response = await fetch(`/api/waitlist/invite/${token}`);
        const data = (await response.json()) as {
          entry?: WaitlistEntry;
          error?: string;
        };

        if (!response.ok || !data.entry) {
          setError(data.error ?? "This invitation link is invalid or has expired.");
          return;
        }

        const entry = data.entry;
        const session = getSessionById(entry.sessionId);
        if (!session) {
          setError("Session not found.");
          return;
        }
        upsertWaitlistEntriesFromServer([entry]);

        if (
          entry.inviteExpiresAt &&
          new Date(entry.inviteExpiresAt).getTime() <= Date.now()
        ) {
          updateWaitlistEntry(entry.id, { status: "EXPIRED" });
          setError(
            "This invitation has expired. The next person on the waitlist will be invited.",
          );
          return;
        }

        if (
          entry.status !== "INVITED_TO_BOOK" &&
          entry.status !== "PAYMENT_PENDING"
        ) {
          setError("This invitation is no longer active.");
          return;
        }

        updateWaitlistEntry(entry.id, { status: "PAYMENT_PENDING" });

        const feeSettings = getFeeSettings();
        const vatBreakdown = calculateVatBreakdown(session.price);
        const payment = calculatePaymentBreakdown(
          vatBreakdown.grossAmount,
          session.platformFeePercent,
          feeSettings.feeHandling,
        );

        const booking = saveBooking({
          sessionId: session.id,
          sessionTitle: session.sessionTitle,
          providerName: session.location || "Activora Club",
          day: session.day,
          startTime: session.startTime,
          endTime: session.endTime,
          pricePaid: payment.customerPrice,
          parentName: entry.parentName,
          email: entry.email,
          childName: entry.childName,
          childAge: entry.childAge,
          childId: entry.childId ?? undefined,
          emergencyContact: entry.emergencyContact,
          emergencyContactName: entry.emergencyContactName,
          emergencyContactPhone: entry.emergencyContactPhone,
          authorizedCollectionPerson: entry.authorizedCollectionPerson,
          status: "waitlist_pending_payment",
          bookingAnswers: entry.bookingAnswers,
          medicalConditions: entry.medicalConditions,
          allergies: entry.allergies,
          medicationNotes: entry.medicationNotes,
          photoConsentSession: entry.photoConsentSession,
          photoConsentMarketing: entry.photoConsentMarketing,
        });

        incrementSessionBookings(session.id);
        updateWaitlistEntry(entry.id, { status: "BOOKED" });

        const query = new URLSearchParams({
          sessionName: session.sessionTitle,
          childName: entry.childName,
          price: String(payment.customerPrice),
          status: "waitlist_pending_payment",
          bookingId: booking.id,
          waitlistInvite: "1",
        });

        router.replace(`/book/confirmation?${query.toString()}`);
      } catch {
        setError("Could not redeem this invitation. Try again shortly.");
      }
    }

    void redeemInvite();
  }, [token, router]);

  if (!error) {
    return <LoadingState message="Preparing your booking..." />;
  }

  return (
    <div className="flex min-h-full flex-col bg-white text-zinc-900">
      <header className="border-b border-zinc-100">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo size="desktop" href="/" />
        </nav>
      </header>
      <main className="mx-auto max-w-lg flex-1 px-6 py-14 text-center">
        <h1 className="text-2xl font-bold text-zinc-900">Invitation unavailable</h1>
        <p className="mt-2 text-sm text-zinc-600">{error}</p>
        <a
          href="/parent/waitlist"
          className="mt-6 inline-flex rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white"
        >
          View waitlist
        </a>
      </main>
      <PoweredByActivoraFooter />
    </div>
  );
}

export default function WaitlistInvitePage() {
  return (
    <Suspense fallback={<LoadingState message="Loading invitation..." />}>
      <InviteBookingContent />
    </Suspense>
  );
}
