"use client";

import Link from "next/link";
import { useCallback, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Building2,
  ChevronDown,
  Handshake,
  Heart,
  Sparkles,
  Users,
} from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { HomeHeader } from "@/components/home/HomeHeader";
import { LazySupportLauncher } from "@/components/support/LazySupportLauncher";
import {
  createPartnershipEnquiry,
  PARTNERSHIP_CATEGORY_LABELS,
  PARTNERSHIP_COUNTRY_OPTIONS,
  PARTNERSHIP_MISSION_TEXT,
  PARTNERSHIP_STATS,
  PARTNERSHIP_TYPE_CARDS,
  type PartnershipCategory,
} from "@/lib/partnerships";

const INPUT_CLASS =
  "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-100";

const LABEL_CLASS = "text-xs font-semibold text-zinc-700";

const CARD_ICONS = [Building2, Heart, Users, Sparkles] as const;

type FormState = {
  organisationName: string;
  website: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  partnershipCategory: PartnershipCategory | "";
  country: string;
  proposedIdea: string;
  expectedOutcomes: string;
  preferredMeetingDate: string;
  additionalInformation: string;
};

const INITIAL_FORM: FormState = {
  organisationName: "",
  website: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  partnershipCategory: "",
  country: "",
  proposedIdea: "",
  expectedOutcomes: "",
  preferredMeetingDate: "",
  additionalInformation: "",
};

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export function PartnershipsPage() {
  const formRef = useRef<HTMLDivElement>(null);
  const categorySelectRef = useRef<HTMLSelectElement>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  const openFormWithCategory = useCallback((category: PartnershipCategory) => {
    setForm((current) => ({ ...current, partnershipCategory: category }));
    scrollToId("partnership-form");
    window.setTimeout(() => {
      categorySelectRef.current?.focus();
    }, 400);
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) {
      return;
    }

    if (
      !form.organisationName.trim() ||
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.partnershipCategory ||
      !form.country ||
      !form.proposedIdea.trim()
    ) {
      setError("Please complete all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      createPartnershipEnquiry({
        organisationName: form.organisationName,
        website: form.website,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        partnershipCategory: form.partnershipCategory,
        country: form.country,
        proposedIdea: form.proposedIdea,
        expectedOutcomes: form.expectedOutcomes,
        preferredMeetingDate: form.preferredMeetingDate,
        additionalInformation: form.additionalInformation,
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
    <div className="flex min-h-full flex-col bg-white text-zinc-900">
      <HomeHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative border-b border-zinc-100 bg-gradient-to-b from-[#072B44] to-[#0a3d5c] text-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <p className="text-sm font-bold uppercase tracking-wider text-teal-300">
              Partnerships
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Partner with Activora
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-teal-50/90">
              Let&apos;s build better opportunities for children, clubs and
              communities together.
            </p>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-teal-50/80">
              We believe great partnerships create better experiences for
              families, stronger providers, and more opportunities for children
              to participate, learn and grow.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => scrollToId("partnership-form")}
                className="rounded-xl bg-teal-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-300/50"
              >
                Arrange a meeting
              </button>
              <button
                type="button"
                onClick={() => scrollToId("partnership-types")}
                className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                Become a partner
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => scrollToId("partnership-types")}
            className="mx-auto mb-8 flex flex-col items-center gap-1 text-xs font-medium text-teal-200/80 transition hover:text-teal-100"
            aria-label="Explore partnership opportunities"
          >
            <span>Explore partnership opportunities</span>
            <ChevronDown className="h-5 w-5 animate-bounce" aria-hidden />
          </button>
        </section>

        {/* Partnership types */}
        <section
          id="partnership-types"
          className="scroll-mt-24 border-b border-zinc-100 bg-gradient-to-b from-teal-50/60 to-white py-16 sm:py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Handshake className="h-7 w-7 text-teal-600" aria-hidden />
              <h2 className="text-3xl font-bold text-zinc-900">
                Partnership types
              </h2>
            </div>
            <p className="mt-3 max-w-2xl text-zinc-600">
              Choose the partnership model that fits your organisation — or tell
              us about something new.
            </p>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {PARTNERSHIP_TYPE_CARDS.map((card, index) => {
                const Icon = CARD_ICONS[index] ?? Handshake;
                return (
                  <article
                    key={card.id}
                    className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-teal-200 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <div>
                        <h3 className="text-lg font-bold text-zinc-900">
                          {card.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                          {card.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
                          Examples
                        </p>
                        <ul className="mt-2 space-y-1 text-sm text-zinc-600">
                          {card.examples.map((example) => (
                            <li key={example} className="flex gap-2">
                              <span className="text-teal-500" aria-hidden>
                                •
                              </span>
                              {example}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
                          Benefits
                        </p>
                        <ul className="mt-2 space-y-1 text-sm text-zinc-600">
                          {card.benefits.map((benefit) => (
                            <li key={benefit} className="flex gap-2">
                              <span className="text-teal-500" aria-hidden>
                                ✓
                              </span>
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openFormWithCategory(card.id)}
                      className="mt-6 inline-flex items-center gap-2 self-start rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
                    >
                      {card.ctaLabel}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Why partner */}
        <section className="border-b border-zinc-100 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-zinc-900">
              Why partner with Activora
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {PARTNERSHIP_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm"
                >
                  <p className="text-3xl font-bold text-teal-600">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm font-medium text-zinc-600">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
            <p className="mx-auto mt-10 max-w-2xl text-center text-lg leading-relaxed text-zinc-700">
              {PARTNERSHIP_MISSION_TEXT}
            </p>
          </div>
        </section>

        {/* Book a partnership call */}
        <section
          id="partnership-form"
          className="scroll-mt-24 bg-gradient-to-b from-zinc-50 to-white py-12 sm:py-16"
        >
          <div ref={formRef} className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-xl shadow-zinc-200/50">
              <div className="grid lg:grid-cols-2">
                <div className="bg-gradient-to-br from-teal-700 via-teal-800 to-zinc-900 p-7 sm:p-9 lg:p-10">
                  <p className="text-xs font-semibold uppercase tracking-wider text-teal-200/90">
                    Book a partnership call
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                    Let&apos;s explore what we could build together.
                  </h2>
                  <div className="mt-4 space-y-2 text-sm leading-relaxed text-teal-50/90 sm:text-base">
                    <p>Have an idea?</p>
                    <p>Want to support clubs?</p>
                    <p>Looking to launch something nationally?</p>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-teal-50/80">
                    Arrange a conversation with Chima and let&apos;s see
                    what&apos;s possible.
                  </p>
                </div>

                <div className="p-7 sm:p-9 lg:p-10">
                  {submitted ? (
                    <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-teal-100 bg-teal-50/50 px-6 py-10 text-center">
                      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-2xl text-teal-700">
                        ✓
                      </span>
                      <h3 className="text-lg font-bold text-zinc-900">
                        Thank you for reaching out.
                      </h3>
                      <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-600">
                        We&apos;ll review your proposal and get back to you
                        shortly.
                      </p>
                      <button
                        type="button"
                        onClick={() => setSubmitted(false)}
                        className="mt-6 text-sm font-semibold text-teal-700 hover:text-teal-800"
                      >
                        Submit another enquiry
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                      <div>
                        <label htmlFor="partner-org-name" className={LABEL_CLASS}>
                          Organisation name *
                        </label>
                        <input
                          id="partner-org-name"
                          type="text"
                          required
                          value={form.organisationName}
                          onChange={(e) =>
                            updateField("organisationName", e.target.value)
                          }
                          className={INPUT_CLASS}
                          autoComplete="organization"
                        />
                      </div>

                      <div>
                        <label htmlFor="partner-website" className={LABEL_CLASS}>
                          Website
                        </label>
                        <input
                          id="partner-website"
                          type="url"
                          placeholder="https://"
                          value={form.website}
                          onChange={(e) => updateField("website", e.target.value)}
                          className={INPUT_CLASS}
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="partner-first-name" className={LABEL_CLASS}>
                            First name *
                          </label>
                          <input
                            id="partner-first-name"
                            type="text"
                            required
                            value={form.firstName}
                            onChange={(e) =>
                              updateField("firstName", e.target.value)
                            }
                            className={INPUT_CLASS}
                            autoComplete="given-name"
                          />
                        </div>
                        <div>
                          <label htmlFor="partner-last-name" className={LABEL_CLASS}>
                            Last name *
                          </label>
                          <input
                            id="partner-last-name"
                            type="text"
                            required
                            value={form.lastName}
                            onChange={(e) =>
                              updateField("lastName", e.target.value)
                            }
                            className={INPUT_CLASS}
                            autoComplete="family-name"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="partner-email" className={LABEL_CLASS}>
                            Email *
                          </label>
                          <input
                            id="partner-email"
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => updateField("email", e.target.value)}
                            className={INPUT_CLASS}
                            autoComplete="email"
                          />
                        </div>
                        <div>
                          <label htmlFor="partner-phone" className={LABEL_CLASS}>
                            Phone *
                          </label>
                          <input
                            id="partner-phone"
                            type="tel"
                            required
                            value={form.phone}
                            onChange={(e) => updateField("phone", e.target.value)}
                            className={INPUT_CLASS}
                            autoComplete="tel"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="partner-category"
                            className={LABEL_CLASS}
                          >
                            Partnership category *
                          </label>
                          <select
                            id="partner-category"
                            ref={categorySelectRef}
                            required
                            value={form.partnershipCategory}
                            onChange={(e) =>
                              updateField(
                                "partnershipCategory",
                                e.target.value as PartnershipCategory | "",
                              )
                            }
                            className={INPUT_CLASS}
                          >
                            <option value="">Select…</option>
                            {(
                              Object.entries(PARTNERSHIP_CATEGORY_LABELS) as [
                                PartnershipCategory,
                                string,
                              ][]
                            ).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="partner-country" className={LABEL_CLASS}>
                            Country *
                          </label>
                          <select
                            id="partner-country"
                            required
                            value={form.country}
                            onChange={(e) => updateField("country", e.target.value)}
                            className={INPUT_CLASS}
                          >
                            <option value="">Select…</option>
                            {PARTNERSHIP_COUNTRY_OPTIONS.map((country) => (
                              <option key={country} value={country}>
                                {country}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="partner-idea" className={LABEL_CLASS}>
                          Proposed idea *
                        </label>
                        <textarea
                          id="partner-idea"
                          rows={3}
                          required
                          value={form.proposedIdea}
                          onChange={(e) =>
                            updateField("proposedIdea", e.target.value)
                          }
                          placeholder="Tell us about your partnership idea"
                          className={`${INPUT_CLASS} resize-y`}
                        />
                      </div>

                      <div>
                        <label htmlFor="partner-outcomes" className={LABEL_CLASS}>
                          Expected outcomes
                        </label>
                        <textarea
                          id="partner-outcomes"
                          rows={2}
                          value={form.expectedOutcomes}
                          onChange={(e) =>
                            updateField("expectedOutcomes", e.target.value)
                          }
                          placeholder="What would success look like?"
                          className={`${INPUT_CLASS} resize-y`}
                        />
                      </div>

                      <div>
                        <label htmlFor="partner-meeting-date" className={LABEL_CLASS}>
                          Preferred meeting date
                        </label>
                        <input
                          id="partner-meeting-date"
                          type="date"
                          value={form.preferredMeetingDate}
                          onChange={(e) =>
                            updateField("preferredMeetingDate", e.target.value)
                          }
                          className={INPUT_CLASS}
                        />
                      </div>

                      <div>
                        <label htmlFor="partner-additional" className={LABEL_CLASS}>
                          Additional information
                        </label>
                        <textarea
                          id="partner-additional"
                          rows={3}
                          value={form.additionalInformation}
                          onChange={(e) =>
                            updateField("additionalInformation", e.target.value)
                          }
                          placeholder="Anything else we should know"
                          className={`${INPUT_CLASS} resize-y`}
                        />
                      </div>

                      {error ? (
                        <p className="text-sm font-medium text-rose-600" role="alert">
                          {error}
                        </p>
                      ) : null}

                      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="inline-flex items-center justify-center rounded-2xl bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-teal-600/25 transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {submitting ? "Submitting…" : "Submit enquiry"}
                        </button>
                        <button
                          type="button"
                          disabled
                          title="Booking link coming soon"
                          className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-3 text-sm font-semibold text-zinc-400"
                        >
                          Book meeting
                          <span className="ml-2 rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                            Coming soon
                          </span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="border-t border-zinc-100 bg-[#072B44] py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-lg font-semibold text-white sm:text-xl">
              Interested in working together?
            </p>
            <Link
              href="#partnership-form"
              onClick={(e) => {
                e.preventDefault();
                scrollToId("partnership-form");
              }}
              className="mt-4 inline-flex items-center gap-2 text-base font-bold text-teal-400 transition hover:text-teal-300"
            >
              Partner with Activora
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
      <LazySupportLauncher />
    </div>
  );
}
