"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  CalendarDays,
  MessageCircle,
  PhoneCall,
} from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { HomeHeader } from "@/components/home/HomeHeader";
import { LazySupportLauncher } from "@/components/support/LazySupportLauncher";
import {
  CALLBACK_REASON_OPTIONS,
  CALLBACK_REASON_LABELS,
  createCallbackRequest,
  FOOTER_SUPPORT_HOURS,
  type CallbackReason,
} from "@/lib/callback-requests";
import { openSupportDrawer } from "@/lib/inbox/storage";

const INPUT_CLASS =
  "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-100";

const LABEL_CLASS = "text-xs font-semibold text-zinc-700";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  organisation: string;
  reason: CallbackReason | "";
  preferredDate: string;
  preferredTime: string;
  additionalNotes: string;
  consentGiven: boolean;
};

const INITIAL_FORM: FormState = {
  fullName: "",
  email: "",
  phone: "",
  organisation: "",
  reason: "",
  preferredDate: "",
  preferredTime: "",
  additionalNotes: "",
  consentGiven: false,
};

type ContactPageProps = {
  initialTab?: string;
};

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export function ContactPage({ initialTab }: ContactPageProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (initialTab === "callback") {
      window.setTimeout(() => scrollToId("callback-form"), 300);
    }
  }, [initialTab]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  const openCallbackForm = useCallback(() => {
    scrollToId("callback-form");
    window.setTimeout(() => {
      formRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    }, 400);
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) {
      return;
    }

    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.reason ||
      !form.consentGiven
    ) {
      setError("Please complete all required fields and accept the consent checkbox.");
      return;
    }

    setSubmitting(true);
    try {
      createCallbackRequest({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        organisation: form.organisation,
        reason: form.reason,
        preferredDate: form.preferredDate,
        preferredTime: form.preferredTime,
        additionalNotes: form.additionalNotes,
        consentGiven: form.consentGiven,
      });
      setSubmitted(true);
      setForm(INITIAL_FORM);
      setToast("Confirmation email sent");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmitAnother() {
    setSubmitted(false);
    setError(null);
    openCallbackForm();
  }

  return (
    <div className="flex min-h-full flex-col bg-white text-zinc-900">
      <HomeHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative border-b border-zinc-100 bg-gradient-to-b from-[#072B44] to-[#0a3d5c] text-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <p className="text-sm font-bold uppercase tracking-wider text-teal-300">
              Contact
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Need to speak with our team?
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-teal-50/90">
              Whether you&apos;re exploring Activora or already using the platform,
              request a callback and we&apos;ll get in touch.
            </p>
            <p className="mt-3 text-sm text-teal-100/80">
              Support hours: {FOOTER_SUPPORT_HOURS}
            </p>
          </div>
        </section>

        {/* Contact cards */}
        <section className="border-b border-zinc-100 bg-zinc-50/60">
          <div className="mx-auto grid max-w-6xl gap-4 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={openCallbackForm}
              className="group rounded-2xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
            >
              <PhoneCall
                className="h-7 w-7 text-teal-600 transition-colors group-hover:text-teal-500"
                aria-hidden
              />
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-teal-700">
                Call request
              </p>
              <p className="mt-1 text-sm text-zinc-600">Arrange a callback</p>
            </button>

            <Link
              href="/#book-demo"
              className="group rounded-2xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
            >
              <CalendarDays
                className="h-7 w-7 text-teal-600 transition-colors group-hover:text-teal-500"
                aria-hidden
              />
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-teal-700">
                Book a demo
              </p>
              <p className="mt-1 text-sm text-zinc-600">Schedule a walkthrough</p>
            </Link>

            <button
              type="button"
              onClick={() => openSupportDrawer({ newChat: true })}
              className="group rounded-2xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
            >
              <MessageCircle
                className="h-7 w-7 text-teal-600 transition-colors group-hover:text-teal-500"
                aria-hidden
              />
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-teal-700">
                Support chat
              </p>
              <p className="mt-1 text-sm text-zinc-600">Chat with our team</p>
            </button>
          </div>
        </section>

        {/* Callback form */}
        <section
          id="callback-form"
          ref={formRef}
          className="mx-auto max-w-2xl px-4 py-14 sm:px-6 lg:px-8"
        >
          {submitted ? (
            <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-8 text-center shadow-sm">
              <h2 className="text-2xl font-bold text-zinc-900">
                Callback requested
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                Thanks — we&apos;ve received your request. Our team will contact
                you during opening hours.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-500"
                >
                  Back to homepage
                </Link>
                <button
                  type="button"
                  onClick={handleSubmitAnother}
                  className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
                >
                  Submit another request
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
                Request a callback
              </h2>
              <p className="mt-2 text-sm text-zinc-600">
                Tell us how to reach you and we&apos;ll call back during support
                hours.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="callback-name" className={LABEL_CLASS}>
                    Full name *
                  </label>
                  <input
                    id="callback-name"
                    type="text"
                    required
                    autoComplete="name"
                    className={INPUT_CLASS}
                    value={form.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="callback-email" className={LABEL_CLASS}>
                      Email *
                    </label>
                    <input
                      id="callback-email"
                      type="email"
                      required
                      autoComplete="email"
                      className={INPUT_CLASS}
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="callback-phone" className={LABEL_CLASS}>
                      Phone *
                    </label>
                    <input
                      id="callback-phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      className={INPUT_CLASS}
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="callback-org" className={LABEL_CLASS}>
                    Organisation / club
                  </label>
                  <input
                    id="callback-org"
                    type="text"
                    className={INPUT_CLASS}
                    value={form.organisation}
                    onChange={(e) => updateField("organisation", e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="callback-reason" className={LABEL_CLASS}>
                    Reason *
                  </label>
                  <select
                    id="callback-reason"
                    required
                    className={INPUT_CLASS}
                    value={form.reason}
                    onChange={(e) =>
                      updateField("reason", e.target.value as CallbackReason | "")
                    }
                  >
                    <option value="">Select a reason</option>
                    {CALLBACK_REASON_OPTIONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {CALLBACK_REASON_LABELS[reason]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="callback-date" className={LABEL_CLASS}>
                      Preferred callback date
                    </label>
                    <input
                      id="callback-date"
                      type="date"
                      className={INPUT_CLASS}
                      value={form.preferredDate}
                      onChange={(e) =>
                        updateField("preferredDate", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor="callback-time" className={LABEL_CLASS}>
                      Preferred callback time
                    </label>
                    <input
                      id="callback-time"
                      type="time"
                      className={INPUT_CLASS}
                      value={form.preferredTime}
                      onChange={(e) =>
                        updateField("preferredTime", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="callback-notes" className={LABEL_CLASS}>
                    Additional notes
                  </label>
                  <textarea
                    id="callback-notes"
                    rows={4}
                    className={INPUT_CLASS}
                    value={form.additionalNotes}
                    onChange={(e) =>
                      updateField("additionalNotes", e.target.value)
                    }
                  />
                </div>

                <label className="flex items-start gap-3 text-sm text-zinc-600">
                  <input
                    type="checkbox"
                    required
                    checked={form.consentGiven}
                    onChange={(e) =>
                      updateField("consentGiven", e.target.checked)
                    }
                    className="mt-1 h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span>
                    I consent to Activora contacting me about this request. See
                    our privacy policy for how we handle your data.
                  </span>
                </label>

                {error ? (
                  <p className="text-sm text-rose-600" role="alert">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition-all hover:bg-teal-500 disabled:opacity-60 sm:w-auto"
                >
                  {submitting ? "Submitting…" : "Request callback"}
                </button>
              </form>
            </>
          )}
        </section>
      </main>

      <SiteFooter />
      <LazySupportLauncher />

      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white shadow-lg"
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
