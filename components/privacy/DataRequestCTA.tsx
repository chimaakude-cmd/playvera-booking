"use client";

import { useState, type FormEvent } from "react";
import { Mail } from "lucide-react";
import { PRIVACY_CONTACT } from "@/constants/privacy";

const INPUT_CLASS =
  "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-teal-500 dark:focus:ring-teal-900/40";

const LABEL_CLASS = "text-xs font-semibold text-zinc-700 dark:text-zinc-200";

export function DataRequestCTA() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [requestType, setRequestType] = useState("access");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const subject = encodeURIComponent(
      `Activora data request: ${requestType.replace(/-/g, " ")}`,
    );
    const body = encodeURIComponent(
      [
        `Name: ${name.trim()}`,
        `Email: ${email.trim()}`,
        `Request type: ${requestType}`,
        "",
        "Details:",
        details.trim(),
      ].join("\n"),
    );

    window.location.href = `mailto:${PRIVACY_CONTACT.email}?subject=${subject}&body=${body}`;
    setSubmitted(true);
  }

  return (
    <div className="mt-4 rounded-2xl border border-teal-200 bg-teal-50/60 p-6 dark:border-teal-800/60 dark:bg-teal-950/30 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300">
          <Mail className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Submit a data request
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Use this form to email our team about access, correction, deletion
            or other privacy requests. We may need to verify your identity before
            responding.
          </p>
        </div>
      </div>

      {submitted ? (
        <p
          className="mt-4 rounded-xl bg-white px-4 py-3 text-sm text-teal-800 dark:bg-zinc-900 dark:text-teal-200"
          role="status"
        >
          Your email app should open with your request. If it did not, email us
          directly at{" "}
          <a
            href={`mailto:${PRIVACY_CONTACT.email}`}
            className="font-medium underline"
          >
            {PRIVACY_CONTACT.email}
          </a>
          .
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={LABEL_CLASS}>Your name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={INPUT_CLASS}
                required
                autoComplete="name"
              />
            </label>
            <label className="block">
              <span className={LABEL_CLASS}>Email address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={INPUT_CLASS}
                required
                autoComplete="email"
              />
            </label>
          </div>

          <label className="block">
            <span className={LABEL_CLASS}>Request type</span>
            <select
              value={requestType}
              onChange={(event) => setRequestType(event.target.value)}
              className={INPUT_CLASS}
            >
              <option value="access">Access my data</option>
              <option value="rectification">Correct my data</option>
              <option value="erasure">Delete my data</option>
              <option value="portability">Data portability</option>
              <option value="restriction">Restrict processing</option>
              <option value="objection">Object to processing</option>
              <option value="other">Other privacy enquiry</option>
            </select>
          </label>

          <label className="block">
            <span className={LABEL_CLASS}>Details</span>
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              rows={4}
              className={INPUT_CLASS}
              placeholder="Please describe your request and include any relevant account email or booking reference."
              required
            />
          </label>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-500"
          >
            Email data request
          </button>
        </form>
      )}
    </div>
  );
}
