"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Logo } from "@/components/branding";
import {
  BUG_REPORT_ACCOUNT_TYPE_LABELS,
  BUG_REPORT_PRIORITY_LABELS,
  captureDeviceInfo,
  createBugReport,
  MAX_SCREENSHOT_DATA_URL_BYTES,
  sanitizeScreenshotUrl,
  type BugReportAccountType,
  type BugReportPriority,
} from "@/lib/bug-reports";

const inputClassName =
  "mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20";

export function BugReportForm() {
  const searchParams = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const [screenshotWarning, setScreenshotWarning] = useState<string | null>(null);
  const [form, setForm] = useState({
    reporterName: "",
    reporterEmail: "",
    accountType: "visitor" as BugReportAccountType,
    pageUrl: "",
    description: "",
    stepsToReproduce: "",
    priority: "normal" as BugReportPriority,
    consentGiven: false,
    screenshotUrl: null as string | null,
  });

  useEffect(() => {
    const urlParam = searchParams.get("url");
    const currentUrl =
      urlParam ?? (typeof window !== "undefined" ? window.location.href : "");
    setForm((current) => ({ ...current, pageUrl: currentUrl }));
  }, [searchParams]);

  function handleScreenshotChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setForm((current) => ({ ...current, screenshotUrl: null }));
      setScreenshotWarning(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : null;
      if (!dataUrl) {
        return;
      }
      if (dataUrl.length > MAX_SCREENSHOT_DATA_URL_BYTES) {
        setForm((current) => ({ ...current, screenshotUrl: null }));
        setScreenshotWarning(
          "Screenshot was too large to attach and was omitted. Please describe the issue in detail.",
        );
        return;
      }
      setScreenshotWarning(null);
      setForm((current) => ({ ...current, screenshotUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.consentGiven) {
      return;
    }

    createBugReport({
      reporterName: form.reporterName,
      reporterEmail: form.reporterEmail,
      accountType: form.accountType,
      pageUrl: form.pageUrl,
      description: form.description,
      stepsToReproduce: form.stepsToReproduce,
      screenshotUrl: sanitizeScreenshotUrl(form.screenshotUrl),
      priority: form.priority,
      consentGiven: form.consentGiven,
      deviceInfo: captureDeviceInfo(),
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f6f7f9] px-4 py-12">
        <div className="w-full max-w-lg rounded-2xl border border-teal-200/80 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-2xl text-teal-600">
            ✓
          </div>
          <h1 className="mt-6 text-xl font-bold text-zinc-900">
            Thank you — your bug report has been sent to the Activora team.
          </h1>
          <p className="mt-3 text-sm text-zinc-500">
            We review every report and will follow up if we need more
            information.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-500"
          >
            Back to homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f9] px-4 py-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size="desktop" />
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900">
            Report a bug
          </h1>
          <p className="mt-2 max-w-md text-sm text-zinc-500">
            Help us improve Activora by describing what went wrong. We
            automatically capture technical details to speed up investigation.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block sm:col-span-1">
              <span className="text-sm font-medium text-zinc-700">Name</span>
              <input
                type="text"
                value={form.reporterName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    reporterName: event.target.value,
                  }))
                }
                className={inputClassName}
                required
              />
            </label>

            <label className="block sm:col-span-1">
              <span className="text-sm font-medium text-zinc-700">Email</span>
              <input
                type="email"
                value={form.reporterEmail}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    reporterEmail: event.target.value,
                  }))
                }
                className={inputClassName}
                required
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-zinc-700">
                Account type
              </span>
              <select
                value={form.accountType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    accountType: event.target.value as BugReportAccountType,
                  }))
                }
                className={inputClassName}
              >
                {(
                  Object.entries(BUG_REPORT_ACCOUNT_TYPE_LABELS) as Array<
                    [BugReportAccountType, string]
                  >
                ).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-zinc-700">Page URL</span>
              <input
                type="url"
                value={form.pageUrl}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    pageUrl: event.target.value,
                  }))
                }
                className={inputClassName}
                required
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-zinc-700">
                What went wrong?
              </span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={4}
                className={inputClassName}
                required
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-zinc-700">
                Steps to reproduce
              </span>
              <textarea
                value={form.stepsToReproduce}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    stepsToReproduce: event.target.value,
                  }))
                }
                rows={4}
                placeholder="1. Go to…&#10;2. Click…&#10;3. See error"
                className={inputClassName}
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-zinc-700">
                Screenshot (optional)
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleScreenshotChange}
                className="mt-1.5 block w-full text-sm text-zinc-600 file:mr-4 file:rounded-lg file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-teal-700 hover:file:bg-teal-100"
              />
              {screenshotWarning ? (
                <p className="mt-2 text-xs text-amber-700">{screenshotWarning}</p>
              ) : null}
              {form.screenshotUrl ? (
                <p className="mt-2 text-xs text-teal-700">Screenshot attached</p>
              ) : null}
            </label>

            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-zinc-700">
                Priority
              </span>
              <select
                value={form.priority}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    priority: event.target.value as BugReportPriority,
                  }))
                }
                className={inputClassName}
              >
                {(
                  Object.entries(BUG_REPORT_PRIORITY_LABELS) as Array<
                    [BugReportPriority, string]
                  >
                ).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-start gap-3 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.consentGiven}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    consentGiven: event.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4 rounded border-zinc-300 text-teal-600"
                required
              />
              <span className="text-sm text-zinc-600">
                I consent to Activora storing this report and contacting me
                about it if needed.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={!form.consentGiven}
            className="mt-6 w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Submit bug report
          </button>
        </form>
      </div>
    </div>
  );
}
