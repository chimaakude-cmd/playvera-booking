"use client";

import { useState, type FormEvent } from "react";
import {
  Cloud,
  KeyRound,
  Lock,
  Server,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { HomeHeader } from "@/components/home/HomeHeader";
import { LazySupportLauncher } from "@/components/support/LazySupportLauncher";
import { TransparencyHero } from "@/components/transparency/TransparencyHero";
import { createSecurityReport } from "@/lib/security-reports";

const INPUT_CLASS =
  "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-100";

const LABEL_CLASS = "text-xs font-semibold text-zinc-700";

const SECURITY_CARDS = [
  {
    icon: ShieldCheck,
    title: "Secure payments",
    description:
      "Card payments are processed by Stripe. Activora never stores full card numbers on our servers.",
  },
  {
    icon: Lock,
    title: "Encryption",
    description:
      "Data in transit uses TLS 1.2+. Sensitive fields are encrypted at rest in our infrastructure.",
  },
  {
    icon: KeyRound,
    title: "Account security",
    description:
      "Role-based access, session timeouts, and audit trails help protect club, parent and admin accounts.",
  },
  {
    icon: Server,
    title: "Infrastructure",
    description:
      "Hosted on modern cloud infrastructure with monitoring, backups and regular security patching.",
  },
  {
    icon: Shield,
    title: "Responsible disclosure",
    description:
      "We welcome good-faith security reports. Use the form below to share details privately with our team.",
  },
] as const;

export function SecurityPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [issue, setIssue] = useState("");
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setAttachmentName(file?.name ?? null);
  }

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
      createSecurityReport({ name, email, issue, attachmentName });
      setSubmitted(true);
      setName("");
      setEmail("");
      setIssue("");
      setAttachmentName(null);
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
          title="Security at Activora"
          subtitle="How we protect payments, data and accounts across the platform."
        />

        <section className="border-b border-zinc-100 py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {SECURITY_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <article
                    key={card.title}
                    className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-teal-200"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <h2 className="mt-4 text-lg font-bold text-zinc-900">
                      {card.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                      {card.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-b from-teal-50/50 to-white py-12 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <Cloud className="h-6 w-6 text-teal-600" aria-hidden />
              <h2 className="text-2xl font-bold text-zinc-900">
                Vulnerability reporting
              </h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Found a security issue? Report responsibly. Please include enough
              detail for us to reproduce the problem. Do not publicly disclose
              vulnerabilities until we have had a chance to respond.
            </p>

            {submitted ? (
              <div
                role="status"
                className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-800"
              >
                Thank you. Your report has been received. Our security team will
                review it and respond if follow-up is needed.
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
              >
                <div>
                  <label htmlFor="sec-name" className={LABEL_CLASS}>
                    Name *
                  </label>
                  <input
                    id="sec-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className={INPUT_CLASS}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="sec-email" className={LABEL_CLASS}>
                    Email *
                  </label>
                  <input
                    id="sec-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={INPUT_CLASS}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="sec-issue" className={LABEL_CLASS}>
                    Issue description *
                  </label>
                  <textarea
                    id="sec-issue"
                    value={issue}
                    onChange={(event) => setIssue(event.target.value)}
                    rows={5}
                    className={INPUT_CLASS}
                    placeholder="Describe the vulnerability, affected URLs, and steps to reproduce."
                    required
                  />
                </div>
                <div>
                  <label htmlFor="sec-attachment" className={LABEL_CLASS}>
                    Attachment (optional)
                  </label>
                  <input
                    id="sec-attachment"
                    type="file"
                    onChange={handleFileChange}
                    className="mt-1 block w-full text-sm text-zinc-600 file:mr-4 file:rounded-lg file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-teal-700"
                  />
                  {attachmentName ? (
                    <p className="mt-1 text-xs text-zinc-500">
                      Selected: {attachmentName}
                    </p>
                  ) : null}
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
                  {submitting ? "Submitting…" : "Submit report"}
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
