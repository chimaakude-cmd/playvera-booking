"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  Calendar,
  Eye,
  Keyboard,
  Layout,
  MessageSquare,
  Palette,
} from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { HomeHeader } from "@/components/home/HomeHeader";
import { LazySupportLauncher } from "@/components/support/LazySupportLauncher";
import { TransparencyHero } from "@/components/transparency/TransparencyHero";
import {
  createAccessibilityFeedback,
  LAST_ACCESSIBILITY_REVIEW_DATE,
} from "@/lib/accessibility-feedback";

const INPUT_CLASS =
  "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-100";

const LABEL_CLASS = "text-xs font-semibold text-zinc-700";

const COMMITMENTS = [
  {
    icon: Keyboard,
    title: "Keyboard navigation",
    description:
      "Core flows work without a mouse — tab through menus, forms and booking steps.",
  },
  {
    icon: Eye,
    title: "Screen readers",
    description:
      "Semantic HTML, labels and ARIA where needed so assistive tech can parse pages.",
  },
  {
    icon: Palette,
    title: "Colour contrast",
    description:
      "Text and interactive elements aim for WCAG AA contrast on public pages.",
  },
  {
    icon: Layout,
    title: "Responsive layouts",
    description:
      "Pages reflow on mobile, tablet and desktop without losing functionality.",
  },
  {
    icon: MessageSquare,
    title: "Clear language",
    description:
      "Plain English labels, helpful error messages and consistent heading structure.",
  },
] as const;

function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function AccessibilityPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [issue, setIssue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) {
      return;
    }
    if (!name.trim() || !email.trim() || !issue.trim()) {
      setError("Please complete all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      createAccessibilityFeedback({
        name,
        email,
        pageUrl: pageUrl || (typeof window !== "undefined" ? window.location.href : ""),
        issue,
      });
      setSubmitted(true);
      setName("");
      setEmail("");
      setPageUrl("");
      setIssue("");
      setError(null);
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
        <TransparencyHero
          eyebrow="Platform"
          title="Accessibility"
          subtitle="Our commitment to an inclusive experience for clubs, parents and visitors."
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-teal-50">
            <Calendar className="h-4 w-4" aria-hidden />
            Last accessibility review: {formatReviewDate(LAST_ACCESSIBILITY_REVIEW_DATE)}
          </p>
        </TransparencyHero>

        <section className="border-b border-zinc-100 py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-zinc-900">Our commitments</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {COMMITMENTS.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <h3 className="mt-4 text-lg font-bold text-zinc-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-zinc-100 bg-zinc-50/60 py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="rounded-xl bg-teal-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-400"
              >
                Contact support
              </Link>
              <a
                href="#accessibility-form"
                className="rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:border-teal-300"
              >
                Request accessibility support
              </a>
            </div>
          </div>
        </section>

        <section id="accessibility-form" className="scroll-mt-24 py-12 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-zinc-900">
              Accessibility feedback
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Tell us about barriers you encountered. We review every submission.
            </p>

            {submitted ? (
              <div
                role="status"
                className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-800"
              >
                Thank you for your feedback. We will use it to improve Activora
                for everyone.
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
              >
                <div>
                  <label htmlFor="a11y-name" className={LABEL_CLASS}>
                    Name *
                  </label>
                  <input
                    id="a11y-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className={INPUT_CLASS}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="a11y-email" className={LABEL_CLASS}>
                    Email *
                  </label>
                  <input
                    id="a11y-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={INPUT_CLASS}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="a11y-page" className={LABEL_CLASS}>
                    Page URL (optional)
                  </label>
                  <input
                    id="a11y-page"
                    type="url"
                    value={pageUrl}
                    onChange={(event) => setPageUrl(event.target.value)}
                    placeholder="https://activora.com/..."
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="a11y-issue" className={LABEL_CLASS}>
                    Describe the issue *
                  </label>
                  <textarea
                    id="a11y-issue"
                    value={issue}
                    onChange={(event) => setIssue(event.target.value)}
                    rows={5}
                    className={INPUT_CLASS}
                    required
                  />
                </div>
                {error ? (
                  <p className="text-sm text-red-600" role="alert">
                    {error}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-teal-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-400 disabled:opacity-60"
                >
                  {submitting ? "Submitting…" : "Send feedback"}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
      <LazySupportLauncher />
    </div>
  );
}
