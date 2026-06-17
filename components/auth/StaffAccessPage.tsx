"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/branding";
import { writeAuthSession } from "@/lib/auth/session";
import {
  clearStaffAccessAttempts,
  getStaffAccessLockoutRemainingMs,
  handleStaffAccessLoginFailure,
  isStaffAccessLocked,
  type StaffAccessLoginFailureCode,
} from "@/lib/auth/staff-access";
import type { AuthUser } from "@/lib/auth/types";

type SignInMode = "magic-link" | "password";

function formatLockoutRemaining(ms: number): string {
  const minutes = Math.ceil(ms / 60_000);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

export function StaffAccessPage({
  backHref,
  backLabel,
}: {
  backHref?: string;
  backLabel?: string;
} = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(isStaffAccessLocked());
  const [submitting, setSubmitting] = useState(false);
  const [emergencyAvailable, setEmergencyAvailable] = useState(false);
  const [useEmergencyPin, setUseEmergencyPin] = useState(false);
  const [pin, setPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [signInMode, setSignInMode] = useState<SignInMode>("magic-link");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkMessage, setMagicLinkMessage] = useState<string | null>(null);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<
    string | null
  >(null);

  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) {
      setError(urlError);
    }
  }, [searchParams]);

  useEffect(() => {
    async function checkEmergencyAvailable() {
      try {
        const response = await fetch("/api/admin/auth/emergency-available");
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as { available?: boolean };
        setEmergencyAvailable(Boolean(payload.available));
      } catch {
        // Emergency recovery is optional — ignore fetch errors.
      }
    }

    void checkEmergencyAvailable();
  }, []);

  async function handleMagicLinkRequest() {
    setSubmitting(true);
    setMagicLinkSent(false);
    setMagicLinkMessage(null);
    setForgotPasswordSent(false);
    setForgotPasswordMessage(null);

    try {
      const response = await fetch("/api/admin/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Unable to send sign-in link.");
        return;
      }

      setError(null);
      setMagicLinkSent(true);
      setMagicLinkMessage(
        payload.message ?? "Check your email for the sign-in link",
      );
    } catch {
      setError("Unable to send sign-in link right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    setSubmitting(true);
    setForgotPasswordSent(false);
    setForgotPasswordMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Unable to send reset instructions.");
        return;
      }

      setForgotPasswordSent(true);
      setForgotPasswordMessage(
        payload.message ??
          "If this email is registered for admin access, password reset instructions have been sent.",
      );
    } catch {
      setError("Unable to send reset instructions right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEmergencyLogin() {
    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/auth/emergency-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          pin,
          password: newPassword,
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        user?: AuthUser;
        redirectTo?: string;
        error?: string;
      };

      if (!response.ok || !payload.ok || !payload.user) {
        setError(payload.error ?? "Emergency login failed");
        return;
      }

      writeAuthSession(payload.user);
      clearStaffAccessAttempts();
      router.push(payload.redirectTo ?? "/admin/dashboard");
    } catch {
      setError("Unable to recover access right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleProductionLogin() {
    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        user?: AuthUser;
        redirectTo?: string;
        error?: string;
        code?: StaffAccessLoginFailureCode;
      };

      if (!response.ok || !payload.ok || !payload.user) {
        setError(payload.error ?? "Login failed");
        handleStaffAccessLoginFailure(response.status, payload.code);
        if (isStaffAccessLocked()) {
          setLocked(true);
        }
        return;
      }

      writeAuthSession(payload.user);
      clearStaffAccessAttempts();
      router.push(payload.redirectTo ?? "/admin/dashboard");
    } catch {
      setError("Unable to sign in right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMagicLinkSent(false);
    setMagicLinkMessage(null);
    setForgotPasswordSent(false);
    setForgotPasswordMessage(null);

    if (isStaffAccessLocked()) {
      setLocked(true);
      setError("Too many failed attempts. Try again later.");
      return;
    }

    if (useEmergencyPin) {
      void handleEmergencyLogin();
      return;
    }

    if (signInMode === "magic-link") {
      void handleMagicLinkRequest();
      return;
    }

    void handleProductionLogin();
  }

  const lockoutMs = locked ? getStaffAccessLockoutRemainingMs() : 0;
  const formDisabled = locked || submitting;
  const showPasswordFields = useEmergencyPin || signInMode === "password";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-violet-950 via-zinc-950 to-zinc-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <Logo size="desktop" />
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-white">
            Activora Staff Access
          </h1>
          <p className="mt-2 text-sm text-violet-200/70">
            Authorised personnel only
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-violet-500/20 bg-zinc-900/80 p-6 shadow-2xl shadow-violet-950/40 backdrop-blur sm:p-8"
        >
          {!useEmergencyPin ? (
            <div className="mb-5 flex rounded-xl bg-zinc-950/60 p-1 ring-1 ring-violet-500/20">
              <button
                type="button"
                onClick={() => {
                  setSignInMode("magic-link");
                  setError(null);
                  setMagicLinkSent(false);
                  setMagicLinkMessage(null);
                  setForgotPasswordSent(false);
                  setForgotPasswordMessage(null);
                }}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  signInMode === "magic-link"
                    ? "bg-violet-600 text-white"
                    : "text-violet-200/70 hover:text-white"
                }`}
              >
                Email link
              </button>
              <button
                type="button"
                onClick={() => {
                  setSignInMode("password");
                  setError(null);
                  setMagicLinkSent(false);
                  setMagicLinkMessage(null);
                  setForgotPasswordSent(false);
                  setForgotPasswordMessage(null);
                }}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  signInMode === "password"
                    ? "bg-violet-600 text-white"
                    : "text-violet-200/70 hover:text-white"
                }`}
              >
                Password
              </button>
            </div>
          ) : null}

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

          {showPasswordFields ? (
            useEmergencyPin ? (
              <>
                <label className="mt-4 block">
                  <span className="text-sm font-medium text-violet-100">
                    Emergency PIN
                  </span>
                  <input
                    type="password"
                    value={pin}
                    onChange={(event) => setPin(event.target.value)}
                    autoComplete="off"
                    disabled={formDisabled}
                    className="mt-1.5 w-full rounded-xl border border-violet-500/20 bg-zinc-950/60 px-4 py-2.5 text-sm text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50"
                    required
                  />
                </label>
                <label className="mt-4 block">
                  <span className="text-sm font-medium text-violet-100">
                    New password
                  </span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    disabled={formDisabled}
                    minLength={8}
                    className="mt-1.5 w-full rounded-xl border border-violet-500/20 bg-zinc-950/60 px-4 py-2.5 text-sm text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50"
                    required
                  />
                </label>
              </>
            ) : (
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
            )
          ) : null}

          {signInMode === "password" && !useEmergencyPin ? (
            <p className="mt-3 text-right">
              <button
                type="button"
                onClick={() => void handleForgotPassword()}
                disabled={formDisabled || !email.trim()}
                className="text-xs font-medium text-violet-300/80 underline-offset-2 hover:text-violet-100 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                Forgot password?
              </button>
            </p>
          ) : null}

          {magicLinkSent && magicLinkMessage ? (
            <p className="mt-4 rounded-xl bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300 ring-1 ring-emerald-500/20">
              {magicLinkMessage}
            </p>
          ) : null}

          {forgotPasswordSent && forgotPasswordMessage ? (
            <p className="mt-4 rounded-xl bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300 ring-1 ring-emerald-500/20">
              {forgotPasswordMessage}
            </p>
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
            {submitting
              ? useEmergencyPin
                ? "Recovering access…"
                : signInMode === "magic-link"
                  ? "Sending link…"
                  : "Signing in…"
              : useEmergencyPin
                ? "Recover access"
                : signInMode === "magic-link"
                  ? "Sign in with email link"
                  : "Sign in"}
          </button>

          {emergencyAvailable ? (
            <p className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setUseEmergencyPin((current) => !current);
                  setError(null);
                  setPassword("");
                  setPin("");
                  setNewPassword("");
                  setMagicLinkSent(false);
                  setMagicLinkMessage(null);
                  setForgotPasswordSent(false);
                  setForgotPasswordMessage(null);
                }}
                className="text-xs font-medium text-violet-300/80 underline-offset-2 hover:text-violet-100 hover:underline"
              >
                {useEmergencyPin ? "Use normal sign-in" : "Use emergency PIN"}
              </button>
            </p>
          ) : null}
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
