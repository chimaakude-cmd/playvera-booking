"use client";

import { FormEvent, useState } from "react";
import {
  createJobApplication,
  MAX_CV_DATA_URL_BYTES,
  sanitizeCvDataUrl,
  type CareerJob,
} from "@/lib/careers";

const inputClassName =
  "mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20";

type ApplyFormProps = {
  job: CareerJob;
};

export function ApplyForm({ job }: ApplyFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [cvWarning, setCvWarning] = useState<string | null>(null);
  const [form, setForm] = useState({
    candidateName: "",
    candidateEmail: "",
    candidatePhone: "",
    cvDataUrl: null as string | null,
    cvFileName: null as string | null,
    coverNote: "",
    linkedInUrl: "",
    availability: "",
    rightToWork: false,
  });

  function handleCvChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setForm((current) => ({
        ...current,
        cvDataUrl: null,
        cvFileName: null,
      }));
      setCvWarning(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : null;
      if (!dataUrl) {
        return;
      }
      if (dataUrl.length > MAX_CV_DATA_URL_BYTES) {
        setForm((current) => ({
          ...current,
          cvDataUrl: null,
          cvFileName: file.name,
        }));
        setCvWarning(
          "Your CV was too large to attach (max 500KB). We'll note the filename — please also paste key details in your cover note.",
        );
        return;
      }
      setCvWarning(null);
      setForm((current) => ({
        ...current,
        cvDataUrl: dataUrl,
        cvFileName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.rightToWork) {
      return;
    }

    createJobApplication({
      jobId: job.id,
      candidateName: form.candidateName,
      candidateEmail: form.candidateEmail,
      candidatePhone: form.candidatePhone,
      cvDataUrl: sanitizeCvDataUrl(form.cvDataUrl),
      cvFileName: form.cvFileName,
      coverNote: form.coverNote,
      linkedInUrl: form.linkedInUrl,
      availability: form.availability,
      rightToWork: form.rightToWork,
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        className="rounded-2xl border border-teal-200 bg-teal-50/50 p-8 text-center"
        role="status"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-2xl text-teal-600">
          ✓
        </div>
        <h2 className="mt-6 text-xl font-bold text-zinc-900">
          Thanks for applying
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          Our recruitment team will review your application and be in touch soon.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      aria-labelledby="apply-form-heading"
    >
      <h2 id="apply-form-heading" className="text-xl font-bold text-zinc-900">
        Apply for this role
      </h2>
      <p className="mt-1 text-sm text-zinc-600">
        All fields marked with * are required.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="apply-name" className="text-sm font-medium text-zinc-700">
            Full name *
          </label>
          <input
            id="apply-name"
            type="text"
            required
            autoComplete="name"
            className={inputClassName}
            value={form.candidateName}
            onChange={(e) =>
              setForm((c) => ({ ...c, candidateName: e.target.value }))
            }
          />
        </div>
        <div>
          <label htmlFor="apply-email" className="text-sm font-medium text-zinc-700">
            Email *
          </label>
          <input
            id="apply-email"
            type="email"
            required
            autoComplete="email"
            className={inputClassName}
            value={form.candidateEmail}
            onChange={(e) =>
              setForm((c) => ({ ...c, candidateEmail: e.target.value }))
            }
          />
        </div>
        <div>
          <label htmlFor="apply-phone" className="text-sm font-medium text-zinc-700">
            Phone *
          </label>
          <input
            id="apply-phone"
            type="tel"
            required
            autoComplete="tel"
            className={inputClassName}
            value={form.candidatePhone}
            onChange={(e) =>
              setForm((c) => ({ ...c, candidatePhone: e.target.value }))
            }
          />
        </div>
        <div>
          <label htmlFor="apply-linkedin" className="text-sm font-medium text-zinc-700">
            LinkedIn
          </label>
          <input
            id="apply-linkedin"
            type="url"
            placeholder="https://linkedin.com/in/..."
            className={inputClassName}
            value={form.linkedInUrl}
            onChange={(e) =>
              setForm((c) => ({ ...c, linkedInUrl: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="apply-cv" className="text-sm font-medium text-zinc-700">
          CV upload
        </label>
        <input
          id="apply-cv"
          type="file"
          accept=".pdf,.doc,.docx"
          className="mt-1.5 block w-full text-sm text-zinc-600 file:mr-4 file:rounded-lg file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-teal-700 hover:file:bg-teal-100"
          onChange={handleCvChange}
        />
        {cvWarning ? (
          <p className="mt-2 text-sm text-amber-700" role="alert">
            {cvWarning}
          </p>
        ) : null}
        {form.cvFileName && !cvWarning ? (
          <p className="mt-2 text-sm text-teal-700">
            Attached: {form.cvFileName}
          </p>
        ) : null}
      </div>

      <div className="mt-5">
        <label htmlFor="apply-cover" className="text-sm font-medium text-zinc-700">
          Cover note *
        </label>
        <textarea
          id="apply-cover"
          required
          rows={4}
          className={inputClassName}
          placeholder="Tell us why you're interested in this role..."
          value={form.coverNote}
          onChange={(e) =>
            setForm((c) => ({ ...c, coverNote: e.target.value }))
          }
        />
      </div>

      <div className="mt-5">
        <label htmlFor="apply-availability" className="text-sm font-medium text-zinc-700">
          Availability *
        </label>
        <input
          id="apply-availability"
          type="text"
          required
          placeholder="e.g. Immediate, 4 weeks notice"
          className={inputClassName}
          value={form.availability}
          onChange={(e) =>
            setForm((c) => ({ ...c, availability: e.target.value }))
          }
        />
      </div>

      <div className="mt-5">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            required
            checked={form.rightToWork}
            onChange={(e) =>
              setForm((c) => ({ ...c, rightToWork: e.target.checked }))
            }
            className="mt-1 h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500/20"
          />
          <span className="text-sm text-zinc-700">
            I confirm I have the right to work in the UK *
          </span>
        </label>
      </div>

      <button
        type="submit"
        className="mt-6 w-full rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 sm:w-auto"
      >
        Submit application
      </button>
    </form>
  );
}
