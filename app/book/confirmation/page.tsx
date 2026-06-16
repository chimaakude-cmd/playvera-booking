"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { LoadingState } from "@/components/club/LoadingState";
import { VatBreakdownPanel } from "@/components/club/finance/VatBreakdownPanel";
import { PoweredByActivoraFooter } from "@/components/PoweredByActivoraFooter";
import { Logo } from "@/components/branding";
import { finalizeBookingOnClient } from "@/lib/booking-checkout/finalize";
import { clearBookingDraft } from "@/lib/booking-flow/draft-storage";
import { calculateVatBreakdown } from "@/lib/club-finance/vat";
import { getFeeSettings } from "@/lib/fee-settings";
import { calculatePaymentBreakdown, formatMoney } from "@/lib/payments";

function BookingConfirmationContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "confirmed" | "error">(
    "loading",
  );
  const [error, setError] = useState("");
  const [childName, setChildName] = useState(
    searchParams.get("childName") ?? "Child",
  );
  const [sessionName, setSessionName] = useState(
    searchParams.get("sessionName") ?? "Session",
  );
  const price = Number(searchParams.get("price") ?? "0");
  const checkout = searchParams.get("checkout");
  const pendingId = searchParams.get("pending_id");
  const stripeSessionId = searchParams.get("session_id");

  useEffect(() => {
    async function confirmPayment() {
      if (checkout !== "success" || !pendingId) {
        if (searchParams.get("status") === "confirmed") {
          setStatus("confirmed");
        } else {
          setStatus("confirmed");
        }
        return;
      }

      try {
        const url = new URL("/api/stripe/checkout/booking/complete", window.location.origin);
        url.searchParams.set("pending_id", pendingId);
        if (stripeSessionId) {
          url.searchParams.set("session_id", stripeSessionId);
        }

        const response = await fetch(url.toString());
        const data = (await response.json()) as {
          payload?: import("@/lib/booking-checkout/server-store").PendingBookingPayload;
          error?: string;
        };

        if (!response.ok || !data.payload) {
          throw new Error(data.error ?? "Could not confirm payment.");
        }

        const booking = finalizeBookingOnClient(data.payload);
        clearBookingDraft(data.payload.sessionId);
        setChildName(booking.childName);
        setSessionName(booking.sessionTitle);
        setStatus("confirmed");
      } catch (confirmError) {
        setError(
          confirmError instanceof Error
            ? confirmError.message
            : "Confirmation failed.",
        );
        setStatus("error");
      }
    }

    void confirmPayment();
  }, [checkout, pendingId, stripeSessionId, searchParams]);

  const vatBreakdown = calculateVatBreakdown(price > 0 ? price : 0);
  const feeSettings = getFeeSettings();
  const totalPaid =
    price > 0
      ? calculatePaymentBreakdown(
          vatBreakdown.grossAmount,
          undefined,
          feeSettings.feeHandling,
        ).customerPrice
      : null;

  if (status === "loading") {
    return <LoadingState message="Confirming your booking…" />;
  }

  return (
    <div className="flex min-h-full flex-col bg-[#F8FAFC] text-[#0F172A]">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo size="desktop" href="/" />
        </nav>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-16 sm:py-24">
        <div className="rounded-[24px] border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
          {status === "error" ? (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-2xl text-rose-700">
                !
              </div>
              <h1 className="mt-6 text-2xl font-bold">Payment issue</h1>
              <p className="mt-3 text-sm text-slate-600">{error}</p>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">
                ✓
              </div>
              <h1 className="mt-6 text-2xl font-bold">Booking confirmed</h1>
              <p className="mt-3 text-sm text-slate-600">
                Payment received. A confirmation email will be sent shortly.
              </p>
            </>
          )}

          <dl className="mt-8 space-y-4 text-left text-sm">
            <div>
              <dt className="font-medium text-slate-500">Session</dt>
              <dd className="mt-1 text-lg font-semibold">{sessionName}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Child</dt>
              <dd className="mt-1 text-lg font-semibold">{childName}</dd>
            </div>
            {totalPaid !== null ? (
              <div>
                <dt className="font-medium text-slate-500">Amount paid</dt>
                <dd className="mt-1 text-lg font-semibold">
                  {formatMoney(totalPaid)}
                </dd>
                <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <VatBreakdownPanel breakdown={vatBreakdown} compact />
                </div>
              </div>
            ) : null}
          </dl>

          <a
            href="/sessions"
            className="mt-8 inline-flex rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Browse more sessions
          </a>
        </div>
      </main>
      <PoweredByActivoraFooter />
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading confirmation..." />}>
      <BookingConfirmationContent />
    </Suspense>
  );
}
