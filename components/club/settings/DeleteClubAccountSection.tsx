"use client";

import { FormEvent, useState } from "react";
import {
  inputClassName,
  labelClassName,
} from "@/components/club/SessionForm";
import { getCurrentUser } from "@/lib/auth";
import { loginErrorMessage } from "@/lib/auth/login-messages";

const CONFIRM_PHRASE = "DELETE MY CLUB";

export function DeleteClubAccountSection() {
  const user = getCurrentUser();
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [financeWarning, setFinanceWarning] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFinanceWarning(null);

    if (!acknowledged) {
      setError("Please confirm you understand this action is permanent.");
      return;
    }

    if (confirmPhrase.trim() !== CONFIRM_PHRASE) {
      setError(`Type "${CONFIRM_PHRASE}" to confirm.`);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/club/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          confirmPhrase,
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        financeWarning?: string | null;
      };

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? loginErrorMessage("generic"));
        return;
      }

      if (payload.financeWarning) {
        setFinanceWarning(payload.financeWarning);
      }

      window.location.href = "/club/login?deleted=1";
    } catch {
      setError(loginErrorMessage("generic"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-rose-200 bg-rose-50/40 p-6 shadow-sm sm:p-8">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-rose-900">Delete my club account</h2>
        <p className="mt-1 text-sm text-rose-800/90">
          Permanently disable your club login, public listings, activities, team access,
          and settings. Completed payment, payout, finance, and audit records are
          retained for legal and accounting purposes.
        </p>
      </div>

      <ul className="mb-5 list-disc space-y-1 pl-5 text-sm text-rose-900/90">
        <li>Your club dashboard and sign-in will stop working immediately.</li>
        <li>Public club pages and live activities will be removed from the marketplace.</li>
        <li>Registers, drafts, media, and team access will be disabled.</li>
        <li>Finance and payout history will be kept.</li>
      </ul>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className={labelClassName}>Confirm account email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className={inputClassName}
          />
        </label>

        <label className="block">
          <span className={labelClassName}>Confirm password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
            className={inputClassName}
          />
        </label>

        <label className="block">
          <span className={labelClassName}>
            Type <span className="font-semibold">{CONFIRM_PHRASE}</span> to confirm
          </span>
          <input
            type="text"
            value={confirmPhrase}
            onChange={(event) => setConfirmPhrase(event.target.value)}
            required
            className={inputClassName}
          />
        </label>

        <label className="flex items-start gap-3 text-sm text-rose-900">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
            className="mt-1"
          />
          <span>
            I understand this permanently removes my club from Activora while finance
            records are retained.
          </span>
        </label>

        {financeWarning ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {financeWarning}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-60"
        >
          {submitting ? "Deleting club account…" : "Delete my club account"}
        </button>
      </form>
    </section>
  );
}
