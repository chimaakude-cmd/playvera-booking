"use client";

import { FormEvent, useState } from "react";
import {
  createTalentPoolSubmission,
  MAX_CV_DATA_URL_BYTES,
  sanitizeCvDataUrl,
  TALENT_POOL_INTEREST_AREAS,
} from "@/lib/careers";

const inputClassName =
  "mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20";

type TalentPoolFormProps = {
  onSuccess?: () => void;
  compact?: boolean;
};

export function TalentPoolForm({ onSuccess, compact }: TalentPoolFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [cvWarning, setCvWarning] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    cvDataUrl: null as string | null,
    cvFileName: null as string | null,
    interestAreas: [] as string[],
  });

  function toggleInterest(area: string) {
    setForm((current) => ({
      ...current,
      interestAreas: current.interestAreas.includes(area)
        ? current.interestAreas.filter((a) => a !== area)
        : [...current.interestAreas, area],
    }));
  }

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
          "Your CV was too large to attach (max 500KB). We'll note the filename.",
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
    createTalentPoolSubmission({
      name: form.name,
      email: form.email,
      cvDataUrl: sanitizeCvDataUrl(form.cvDataUrl),
      cvFileName: form.cvFileName,
      interestAreas: form.interestAreas,
    });
    setSubmitted(true);
    onSuccess?.();
  }

  if (submitted) {
    return (
      <div
        className="rounded-2xl border border-teal-200 bg-teal-50/50 p-6 text-center"
        role="status"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-xl text-teal-600">
          ✓
        </div>
        <p className="mt-4 text-sm font-semibold text-zinc-900">
          You&apos;re on our talent pool — we&apos;ll be in touch when a matching
          role opens.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} aria-labelledby="talent-pool-heading">
      {!compact ? (
        <h2 id="talent-pool-heading" className="text-xl font-bold text-zinc-900">
          Join our talent pool
        </h2>
      ) : (
        <h2 id="talent-pool-heading" className="sr-only">
          Join our talent pool
        </h2>
      )}
      {!compact ? (
        <p className="mt-1 text-sm text-zinc-600">
          No perfect role right now? Share your details and we&apos;ll reach out
          when something fits.
        </p>
      ) : null}

      <div className={`grid gap-4 ${compact ? "mt-0" : "mt-6"}`}>
        <div>
          <label htmlFor="talent-name" className="text-sm font-medium text-zinc-700">
            Full name *
          </label>
          <input
            id="talent-name"
            type="text"
            required
            autoComplete="name"
            className={inputClassName}
            value={form.name}
            onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
          />
        </div>
        <div>
          <label htmlFor="talent-email" className="text-sm font-medium text-zinc-700">
            Email *
          </label>
          <input
            id="talent-email"
            type="email"
            required
            autoComplete="email"
            className={inputClassName}
            value={form.email}
            onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
          />
        </div>
        <div>
          <label htmlFor="talent-cv" className="text-sm font-medium text-zinc-700">
            CV upload
          </label>
          <input
            id="talent-cv"
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
        </div>
        <fieldset>
          <legend className="text-sm font-medium text-zinc-700">
            Interest areas
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {TALENT_POOL_INTEREST_AREAS.map((area) => {
              const selected = form.interestAreas.includes(area);
              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleInterest(area)}
                  aria-pressed={selected}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    selected
                      ? "bg-teal-600 text-white"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  {area}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      <button
        type="submit"
        className="mt-5 w-full rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
      >
        Submit CV
      </button>
    </form>
  );
}
