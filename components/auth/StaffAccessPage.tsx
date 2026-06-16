"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/branding";
import { TEST_ACCOUNTS } from "@/lib/auth/accounts";
import { writeAuthSession } from "@/lib/auth/session";
import {
  getStaffAccessLockoutRemainingMs,
  isStaffAccessLocked,
  staffAccessLogin,
} from "@/lib/auth/staff-access";
import type { AuthUser } from "@/lib/auth/types";

function formatLockoutRemaining(ms: number): string {
  const minutes = Math.ceil(ms / 60_000);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

export function StaffAccessPage({
  backHref,
  backLabel,
  useServerTestLogin = false,
}: {
  backHref?: string;
  backLabel?: string;
  useServerTestLogin?: boolean;
} = {}) {
  const router = useRouter();
  const [email, setEmail] = useState(
    !useServerTestLogin && process.env.NODE_ENV !== "production"
      ? TEST_ACCOUNTS.admin.email
      : "",
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(isStaffAccessLocked());
  const [submitting, setSubmitting] = useState(false);

  async function handleServerTestLogin() {
    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/test-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        setError("Access denied");
        return;
      }

      const payload = (await response.json()) as { ok: true; user: AuthUser };
      writeAuthSession(payload.user);
      router.push("/admin/dashboard");
    } catch {
      setError("Access denied");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (useServerTestLogin) {
      void handleServerTestLogin();
      return;
    }

    if (isStaffAccessLocked()) {
      setLocked(true);
      setError("Login failed");
      return;
    }

    const result = staffAccessLogin(email, password);
    if (!result.ok) {
      if (result.error === "locked") {
        setLocked(true);
      }
      setError("Login failed");
      return;
    }

    router.push(result.redirectTo);
  }

  const lockoutMs = locked ? getStaffAccessLockoutRemainingMs() : 0;
  const formDisabled = locked || submitting;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-violet-950 via-zinc-950 to-zinc-950 px-4 py-12">
      {useServerTestLogin ? (
        <div className="fixed inset-x-0 top-0 z-50 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950">
          DEVELOPMENT MODE — admin access must be secured before launch.
        </div>
      ) : null}
      <div
        className={`w-full max-w-md${useServerTestLogin ? " pt-10" : ""}`}
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <Logo size="desktop" />
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-white">
            {useServerTestLogin ? "Admin Login" : "Activora Staff Access"}
          </h1>
          <p className="mt-2 text-sm text-violet-200/70">
            {useServerTestLogin
              ? "Enter your admin email to continue"
              : "Authorised personnel only"}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-violet-500/20 bg-zinc-900/80 p-6 shadow-2xl shadow-violet-950/40 backdrop-blur sm:p-8"
        >
          <label className="block">
            <span className="text-sm font-medium text-violet-100">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              disabled={formDisabled}
              className="mt-1.5 w-full rounded-xl border border-violet-500/20 bg-zinc-950/60 px-4 py-2.5 text-sm text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50"
              required
            />
          </label>

          {!useServerTestLogin ? (
            <label className="mt-4 block">
              <span className="text-sm font-medium text-violet-100">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                disabled={formDisabled}
                className="mt-1.5 w-full rounded-xl border border-violet-500/20 bg-zinc-950/60 px-4 py-2.5 text-sm text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50"
                required
              />
            </label>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-xl bg-red-950/50 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/20">
              {error}
            </p>
          ) : null}

          {locked && lockoutMs > 0 ? (
            <p className="mt-3 text-center text-xs text-violet-300/60">
              Try again in {formatLockoutRemaining(lockoutMs)}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={formDisabled}
            className="mt-6 w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {backHref && backLabel ? (
          <p className="mt-6 text-center text-sm text-violet-200/70">
            <Link href={backHref} className="font-medium text-violet-200 hover:text-white">
              {backLabel}
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
