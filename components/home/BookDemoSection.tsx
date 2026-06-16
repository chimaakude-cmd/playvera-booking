"use client";

import { useState, type FormEvent } from "react";
import { createDemoEnquiry } from "@/lib/demo-enquiries";
import { ACTIVORA_ACTION } from "@/lib/home/constants";
import { useTranslation } from "@/lib/i18n";
import { HOME_BUTTON, HOME_CARD, HOME_SECTION } from "./shared";

const INPUT_CLASS = `mt-1 w-full border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#0F172A] outline-none transition-colors placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 ${HOME_BUTTON}`;

const LABEL_CLASS = "text-xs font-semibold text-slate-700";

type FormState = {
  clubName: string;
  businessEmail: string;
  businessPhone: string;
  activityType: string;
  additionalInfo: string;
};

const INITIAL_FORM: FormState = {
  clubName: "",
  businessEmail: "",
  businessPhone: "",
  activityType: "",
  additionalInfo: "",
};

export function BookDemoSection() {
  const { t } = useTranslation("homepage");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) {
      return;
    }

    if (
      !form.clubName.trim() ||
      !form.businessEmail.trim() ||
      !form.businessPhone.trim() ||
      !form.activityType.trim()
    ) {
      setError("Please complete all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      createDemoEnquiry({
        clubName: form.clubName,
        businessEmail: form.businessEmail,
        firstName: "Demo",
        lastName: "Enquiry",
        businessPhone: form.businessPhone,
        jobRole: "Not specified",
        programmeSize: "Under 50 children",
        activityType: form.activityType,
        startTimeline: "Just exploring",
        location: "uk",
        additionalInfo: form.additionalInfo,
        consentGiven: true,
      });
      setSubmitted(true);
      setForm(INITIAL_FORM);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="book-demo"
      className={`scroll-mt-24 bg-[#F8FAFC] ${HOME_SECTION}`}
    >
      <div className="mx-auto max-w-xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-[#0F172A] sm:text-3xl">
            {t("bookDemo.title")}
          </h2>
          <p className="mt-2 text-sm text-slate-600">{t("bookDemo.subtitle")}</p>
        </div>

        <div className={`border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5 sm:p-8 ${HOME_CARD}`}>
          {submitted ? (
            <div className="py-8 text-center">
              <span
                className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white"
                style={{ backgroundColor: ACTIVORA_ACTION }}
              >
                ✓
              </span>
              <h3 className="text-lg font-bold text-[#0F172A]">
                {t("bookDemo.successTitle")}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                {t("bookDemo.successBody")}
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-6 text-sm font-semibold hover:underline"
                style={{ color: ACTIVORA_ACTION }}
              >
                {t("bookDemo.submitAnother")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="demo-club-name" className={LABEL_CLASS}>
                  {t("bookDemo.clubName")} *
                </label>
                <input
                  id="demo-club-name"
                  type="text"
                  required
                  value={form.clubName}
                  onChange={(e) => updateField("clubName", e.target.value)}
                  className={INPUT_CLASS}
                  autoComplete="organization"
                />
              </div>

              <div>
                <label htmlFor="demo-business-email" className={LABEL_CLASS}>
                  {t("bookDemo.email")} *
                </label>
                <input
                  id="demo-business-email"
                  type="email"
                  required
                  value={form.businessEmail}
                  onChange={(e) => updateField("businessEmail", e.target.value)}
                  className={INPUT_CLASS}
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="demo-phone" className={LABEL_CLASS}>
                  {t("bookDemo.phone")} *
                </label>
                <input
                  id="demo-phone"
                  type="tel"
                  required
                  value={form.businessPhone}
                  onChange={(e) => updateField("businessPhone", e.target.value)}
                  className={INPUT_CLASS}
                  autoComplete="tel"
                />
              </div>

              <div>
                <label htmlFor="demo-activity-type" className={LABEL_CLASS}>
                  {t("bookDemo.activity")} *
                </label>
                <input
                  id="demo-activity-type"
                  type="text"
                  required
                  placeholder="e.g. Football, Dance, Multi-sport"
                  value={form.activityType}
                  onChange={(e) => updateField("activityType", e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label htmlFor="demo-additional-info" className={LABEL_CLASS}>
                  {t("bookDemo.message")}
                </label>
                <textarea
                  id="demo-additional-info"
                  rows={3}
                  value={form.additionalInfo}
                  onChange={(e) => updateField("additionalInfo", e.target.value)}
                  placeholder="Optional — tell us about your club or preferred call time"
                  className={`${INPUT_CLASS} resize-y`}
                />
              </div>

              {error ? (
                <p className="text-sm font-medium text-rose-600" role="alert">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className={`inline-flex w-full items-center justify-center px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${HOME_BUTTON}`}
                style={{ backgroundColor: ACTIVORA_ACTION }}
              >
                {submitting ? t("bookDemo.submitting") : t("bookDemo.submit")}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
