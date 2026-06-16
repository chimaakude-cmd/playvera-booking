"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { LoadingState } from "@/components/club/LoadingState";
import { BookingQuestionsForm } from "@/components/booking/BookingQuestionsForm";
import { SessionImage } from "@/components/sessions/SessionImage";
import { PoweredByActivoraFooter } from "@/components/PoweredByActivoraFooter";
import { Logo } from "@/components/branding";
import { VatBreakdownPanel } from "@/components/club/finance/VatBreakdownPanel";
import { saveBooking } from "@/lib/bookings";
import {
  buildBookingAnswersFromForm,
  extractMedicalFromAnswers,
  getSessionBookingQuestions,
} from "@/lib/booking-questions";
import { calculateVatBreakdown } from "@/lib/club-finance/vat";
import { getFeeSettings } from "@/lib/fee-settings";
import {
  calculatePaymentBreakdown,
  formatMoney,
  PLATFORM_FEE_PERCENT,
} from "@/lib/payments";
import {
  isGoCardlessCheckoutAvailable,
  isStripeCheckoutAvailable,
} from "@/lib/payment-providers/storage";
import {
  calculateGoCardlessPayoutBreakdown,
  createMockGoCardlessPayment,
} from "@/lib/gocardless";
import {
  ClubSession,
  formatDay,
  formatTimeRange,
  getSessionById,
  incrementSessionBookings,
} from "@/lib/sessions";
import { getSessionImages } from "@/lib/session-images";

const inputClassName =
  "rounded-lg border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200";

const labelClassName = "text-sm font-medium text-zinc-700";

type FormState = {
  parentName: string;
  email: string;
  childName: string;
  childAge: string;
  emergencyContact: string;
};

const initialFormState: FormState = {
  parentName: "",
  email: "",
  childName: "",
  childAge: "",
  emergencyContact: "",
};

type BookSessionPageLegacyProps = {
  session: ClubSession | null;
  loaded: boolean;
};

export default function BookSessionPageLegacy({
  session: initialSession,
  loaded: initialLoaded,
}: BookSessionPageLegacyProps) {
  const router = useRouter();
  const sessionId = initialSession?.id ?? "";

  const [session, setSession] = useState<ClubSession | null>(initialSession);
  const [loaded, setLoaded] = useState(initialLoaded);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );
  const [formError, setFormError] = useState("");
  const [questionValues, setQuestionValues] = useState<
    Record<string, string | boolean>
  >({});
  const [questionErrors, setQuestionErrors] = useState<Record<string, string>>(
    {},
  );
  const [paymentMethod, setPaymentMethod] = useState<
    "stripe_card" | "gocardless_direct_debit"
  >("stripe_card");
  const [checkoutLoaded, setCheckoutLoaded] = useState(false);
  const [stripeCheckoutAvailable, setStripeCheckoutAvailable] = useState(false);
  const [gocardlessCheckoutAvailable, setGocardlessCheckoutAvailable] =
    useState(false);

  const bookingQuestions = useMemo(
    () => (session ? getSessionBookingQuestions(session) : []),
    [session],
  );

  useEffect(() => {
    if (initialSession) {
      return;
    }
    const found = getSessionById(sessionId);
    setSession(found ?? null);
    setLoaded(true);
  }, [sessionId, initialSession]);

  useEffect(() => {
    setStripeCheckoutAvailable(isStripeCheckoutAvailable());
    setGocardlessCheckoutAvailable(isGoCardlessCheckoutAvailable());
    setCheckoutLoaded(true);
    if (isGoCardlessCheckoutAvailable() && !isStripeCheckoutAvailable()) {
      setPaymentMethod("gocardless_direct_debit");
    }
  }, []);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
  }

  function updateQuestionValue(key: string, value: string | boolean) {
    setQuestionValues((current) => ({ ...current, [key]: value }));
    setQuestionErrors((current) => ({ ...current, [key]: "" }));
    setFormError("");
  }

  function validate(): Partial<Record<keyof FormState, string>> {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    (Object.keys(form) as Array<keyof FormState>).forEach((field) => {
      if (!form[field].trim()) {
        nextErrors[field] = "This field is required";
      }
    });

    if (form.childAge.trim() && Number.isNaN(Number(form.childAge))) {
      nextErrors.childAge = "Enter a valid age";
    }

    return nextErrors;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      return;
    }

    const nextErrors = validate();
    const nextQuestionErrors: Record<string, string> = {};

    bookingQuestions.forEach((question) => {
      if (!question.required) return;
      const value = questionValues[question.key];
      if (
        value === undefined ||
        value === "" ||
        (question.answerType === "checkbox" && value !== true)
      ) {
        nextQuestionErrors[question.key] = "This question is required";
      }
    });

    if (
      Object.keys(nextErrors).length > 0 ||
      Object.keys(nextQuestionErrors).length > 0
    ) {
      setErrors(nextErrors);
      setQuestionErrors(nextQuestionErrors);
      setFormError("Please fill in all required fields.");
      return;
    }

    const bookingAnswers = buildBookingAnswersFromForm(
      bookingQuestions,
      questionValues,
    );
    const medical = extractMedicalFromAnswers(bookingAnswers);
    const feeSettings = getFeeSettings();
    const vatBreakdown = calculateVatBreakdown(session.price);
    const payment = calculatePaymentBreakdown(
      vatBreakdown.grossAmount,
      session.platformFeePercent,
      feeSettings.feeHandling,
    );

    const isDirectDebit = paymentMethod === "gocardless_direct_debit";
    const bookingStatus = isDirectDebit ? "pending" : "confirmed";

    const booking = saveBooking({
      sessionId: session.id,
      sessionTitle: session.sessionTitle,
      providerName: session.location || "Activora Club",
      day: session.day,
      startTime: session.startTime,
      endTime: session.endTime,
      pricePaid: payment.customerPrice,
      parentName: form.parentName.trim(),
      email: form.email.trim(),
      childName: form.childName.trim(),
      childAge: Number(form.childAge),
      emergencyContact: form.emergencyContact.trim(),
      status: bookingStatus,
      bookingAnswers,
      medicalConditions: medical.medicalConditions,
      allergies: medical.allergies,
      medicationNotes: medical.medicationNotes,
      photoConsentSession: medical.photoConsentSession,
      photoConsentMarketing: medical.photoConsentMarketing,
    });

    if (isDirectDebit) {
      const gcBreakdown = calculateGoCardlessPayoutBreakdown(
        payment.customerPrice,
        session.platformFeePercent ?? PLATFORM_FEE_PERCENT,
      );
      createMockGoCardlessPayment(
        booking.id,
        "demo-provider-1",
        payment.customerPrice,
        gcBreakdown.activoraPlatformFee,
        gcBreakdown.gocardlessProcessingFee,
        gcBreakdown.providerPayout,
      );
    }

    incrementSessionBookings(session.id);

    const query = new URLSearchParams({
      sessionName: session.sessionTitle,
      childName: form.childName.trim(),
      price: String(session.price),
      status: bookingStatus,
      paymentMethod: paymentMethod,
    });

    router.push(`/book/confirmation?${query.toString()}`);
  }

  function fieldClassName(field: keyof FormState) {
    return errors[field]
      ? `${inputClassName} border-red-300 focus:border-red-400 focus:ring-red-100`
      : inputClassName;
  }

  if (!loaded) {
    return <LoadingState message="Loading session..." />;
  }

  if (!session) {
    return (
      <div className="flex min-h-full flex-col bg-white text-zinc-900">
        <header className="border-b border-zinc-100">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Logo size="desktop" href="/" />
          </nav>
        </header>
        <main className="mx-auto max-w-2xl flex-1 px-6 py-14 text-center">
          <h1 className="text-2xl font-bold text-zinc-900">Session not found</h1>
          <p className="mt-2 text-zinc-500">
            This session may no longer be available.
          </p>
          <a
            href="/sessions"
            className="mt-6 inline-flex rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Back to Sessions
          </a>
        </main>
        <PoweredByActivoraFooter />
      </div>
    );
  }

  const feeSettings = getFeeSettings();
  const vatBreakdown = calculateVatBreakdown(session.price);
  const paymentBreakdown = calculatePaymentBreakdown(
    vatBreakdown.grossAmount,
    session.platformFeePercent,
    feeSettings.feeHandling,
  );
  const totalPrice = paymentBreakdown.customerPrice;
  const gcFeePreview =
    paymentMethod === "gocardless_direct_debit"
      ? calculateGoCardlessPayoutBreakdown(
          totalPrice,
          session.platformFeePercent ?? PLATFORM_FEE_PERCENT,
        )
      : null;
  const showPaymentOptions =
    checkoutLoaded &&
    (stripeCheckoutAvailable || gocardlessCheckoutAvailable);
  const { mainImageId, galleryImageIds } = getSessionImages(session);

  return (
    <div className="flex min-h-full flex-col bg-white text-zinc-900">
      <header className="border-b border-zinc-100">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo size="desktop" href="/" />
          <a
            href="/sessions"
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            Back to Sessions
          </a>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10 sm:py-14">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Book Session
        </h1>
        <p className="mt-2 text-zinc-500">
          Complete your booking details below.
        </p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="relative aspect-[16/9] bg-zinc-100">
            <SessionImage
              imageId={mainImageId}
              alt={session.sessionTitle}
              className="h-full w-full object-cover"
            />
          </div>

          {galleryImageIds.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto border-t border-zinc-100 p-3">
              {galleryImageIds.map((imageId) => (
                <div
                  key={imageId}
                  className="h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-zinc-200"
                >
                  <SessionImage
                    imageId={imageId}
                    alt={`${session.sessionTitle} gallery`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : null}

          <div className="p-5">
            <h2 className="font-semibold text-zinc-900">{session.sessionTitle}</h2>
            <p className="mt-1 text-sm text-zinc-600">
              {formatDay(session.day)} ·{" "}
              {formatTimeRange(session.startTime, session.endTime)}
            </p>
            {session.description ? (
              <p className="mt-4 text-sm leading-6 text-zinc-600">
                {session.description}
              </p>
            ) : null}
            <div className="mt-4 flex flex-col gap-4 border-t border-zinc-200 pt-4">
              <div className="w-full max-w-xs">
                <p className="text-sm font-medium text-zinc-500">Total price</p>
                <p className="mt-1 text-2xl font-bold text-zinc-900">
                  {formatMoney(totalPrice)}
                </p>
                <div className="mt-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <VatBreakdownPanel breakdown={vatBreakdown} compact />
                </div>
              </div>

              {showPaymentOptions ? (
                <div className="rounded-xl border border-zinc-200 bg-white p-4">
                  <p className="text-sm font-semibold text-zinc-900">
                    Payment method
                  </p>
                  <div className="mt-3 space-y-2">
                    {stripeCheckoutAvailable ? (
                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                          paymentMethod === "stripe_card"
                            ? "border-teal-300 bg-teal-50/50"
                            : "border-zinc-200 hover:border-zinc-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="stripe_card"
                          checked={paymentMethod === "stripe_card"}
                          onChange={() => setPaymentMethod("stripe_card")}
                          className="mt-0.5"
                        />
                        <div>
                          <p className="text-sm font-medium text-zinc-900">
                            Card payment (Stripe)
                          </p>
                          <p className="text-xs text-zinc-500">
                            Primary option — instant confirmation when Stripe is
                            connected.
                          </p>
                        </div>
                      </label>
                    ) : null}
                    {gocardlessCheckoutAvailable ? (
                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                          paymentMethod === "gocardless_direct_debit"
                            ? "border-teal-300 bg-teal-50/50"
                            : "border-zinc-200 hover:border-zinc-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="gocardless_direct_debit"
                          checked={
                            paymentMethod === "gocardless_direct_debit"
                          }
                          onChange={() =>
                            setPaymentMethod("gocardless_direct_debit")
                          }
                          className="mt-0.5"
                        />
                        <div>
                          <p className="text-sm font-medium text-zinc-900">
                            Direct Debit (GoCardless)
                          </p>
                          <p className="text-xs text-zinc-500">
                            Backup option — may take a few working days to
                            confirm. Booking stays pending until payment is
                            confirmed.
                          </p>
                        </div>
                      </label>
                    ) : null}
                  </div>

                  {gcFeePreview ? (
                    <div className="mt-4 rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-xs text-zinc-600">
                      <p className="font-medium text-zinc-900">
                        Direct Debit fee breakdown
                      </p>
                      <dl className="mt-2 space-y-1">
                        <div className="flex justify-between">
                          <dt>Customer payment</dt>
                          <dd>{formatMoney(gcFeePreview.customerPayment)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>GoCardless fee</dt>
                          <dd>
                            −{formatMoney(gcFeePreview.gocardlessProcessingFee)}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>
                            Activora fee ({gcFeePreview.platformFeePercent}%)
                          </dt>
                          <dd>
                            −{formatMoney(gcFeePreview.activoraPlatformFee)}
                          </dd>
                        </div>
                        <div className="flex justify-between font-medium text-zinc-900">
                          <dt>Provider receives</dt>
                          <dd>{formatMoney(gcFeePreview.providerPayout)}</dd>
                        </div>
                      </dl>
                    </div>
                  ) : null}
                </div>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-zinc-200 bg-zinc-100 px-6 py-3 text-sm font-semibold text-zinc-500 sm:w-auto"
                >
                  Pay Now — Stripe coming soon
                </button>
              )}
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"
        >
          {formError ? (
            <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </p>
          ) : null}

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="parent-name" className={labelClassName}>
                Parent name
              </label>
              <input
                id="parent-name"
                name="parentName"
                type="text"
                value={form.parentName}
                onChange={(event) =>
                  updateField("parentName", event.target.value)
                }
                placeholder="Your full name"
                className={fieldClassName("parentName")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className={labelClassName}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="you@example.com"
                className={fieldClassName("email")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="child-name" className={labelClassName}>
                Child name
              </label>
              <input
                id="child-name"
                name="childName"
                type="text"
                value={form.childName}
                onChange={(event) =>
                  updateField("childName", event.target.value)
                }
                placeholder="Child's full name"
                className={fieldClassName("childName")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="child-age" className={labelClassName}>
                Child age
              </label>
              <input
                id="child-age"
                name="childAge"
                type="number"
                min={0}
                max={18}
                value={form.childAge}
                onChange={(event) =>
                  updateField("childAge", event.target.value)
                }
                placeholder="Age"
                className={fieldClassName("childAge")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="emergency-contact" className={labelClassName}>
                Emergency contact
              </label>
              <input
                id="emergency-contact"
                name="emergencyContact"
                type="text"
                value={form.emergencyContact}
                onChange={(event) =>
                  updateField("emergencyContact", event.target.value)
                }
                placeholder="Name and phone number"
                className={fieldClassName("emergencyContact")}
              />
            </div>
          </div>

          <div className="mt-6">
            <BookingQuestionsForm
              questions={bookingQuestions}
              values={questionValues}
              errors={questionErrors}
              onChange={updateQuestionValue}
            />
          </div>

          <button
            type="submit"
            className="mt-8 w-full rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 sm:w-auto"
          >
            {paymentMethod === "gocardless_direct_debit"
              ? "Confirm booking — pay by Direct Debit"
              : "Confirm Booking"}
          </button>
        </form>
      </main>
      <PoweredByActivoraFooter />
    </div>
  );
}
