"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/branding";
import { loginErrorMessage } from "@/lib/auth/login-messages";
import { getLoginPath } from "@/lib/auth/routes";
import type { UserRole } from "@/lib/auth/types";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

function resolvePortal(value: string | null): UserRole {
  if (
    value === "club" ||
    value === "parent" ||
    value === "organisation" ||
    value === "admin"
  ) {
    return value;
  }
  return "club";
}

function createClientSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  if (!url || !anonKey) {
    return null;
  }
  return createBrowserClient<Database>(url, anonKey);
}

export function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const portal = resolvePortal(searchParams.get("portal"));
  const loginPath = getLoginPath(portal);
  const urlError = searchParams.get("error");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(
    urlError === "link_expired"
      ? "This reset link has expired. Request a new one from the sign-in page."
      : null,
  );
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClientSupabase();
      if (!supabase) {
        setError(loginErrorMessage("generic"));
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(
          updateError.message || loginErrorMessage("generic"),
        );
        return;
      }

      setSuccess(true);
      window.setTimeout(() => {
        router.replace(loginPath);
      }, 2000);
    } catch {
      setError(loginErrorMessage("generic"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <Logo className="h-8" />
        </div>

        <h1 className="text-center text-xl font-semibold text-zinc-900">
          Set a new password
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-600">
          Choose a strong password for your account.
        </p>

        {success ? (
          <p
            className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            role="status"
          >
            Password updated. Redirecting to sign in…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6">
            <label className="block">
              <span className="text-sm font-medium text-zinc-700">
                New password
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError(null);
                }}
                autoComplete="new-password"
                minLength={8}
                disabled={submitting}
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-500/20"
                required
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-zinc-700">
                Confirm password
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setError(null);
                }}
                autoComplete="new-password"
                minLength={8}
                disabled={submitting}
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-500/20"
                required
              />
            </label>

            {error ? (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-xl bg-violet-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Updating…" : "Update password"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-zinc-600">
          <Link
            href={loginPath}
            className="font-medium text-violet-700 hover:text-violet-900"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
