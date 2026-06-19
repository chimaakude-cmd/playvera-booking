"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ActivoraLoginLayout } from "@/components/auth/ActivoraLoginLayout";
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

const ADMIN_BENEFITS = [
  "Secure staff authentication",
  "Role-based access control",
  "Magic link sign-in",
  "Emergency recovery",
  "Audit trail",
] as const;

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
        setError(payload.error ?? "Unable to sign in");
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
    if (submitting) {
      return;
    }

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
  const inputsDisabled = locked;
  const submitDisabled = locked || submitting;
  const showPasswordFields = useEmergencyPin || signInMode === "password";

  return (
    <ActivoraLoginLayout
      variant="admin"
      headline="Activora staff access."
      subtext="Secure access for authorised Activora team members only."
      benefits={ADMIN_BENEFITS}
      panelFooter="Unauthorised access attempts are logged and monitored."
      cardTitle="Staff sign in"
      cardSubtitle="Authorised personnel only."
      trustIndicators="secure-only"
      backHref={backHref}
      backLabel={backLabel}
    >
      <form onSubmit={handleSubmit}>
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
            onChange={(event) => {
              setEmail(event.target.value);
              setError(null);
            }}
            autoComplete="username"
            disabled={inputsDisabled}
            className="mt-2 w-full rounded-xl border border-violet-500/20 bg-zinc-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50"
            required
          />
        </label>

        {showPasswordFields ? (
          useEmergencyPin ? (
            <>
              <label className="mt-5 block">
                <span className="text-sm font-medium text-violet-100">
                  Emergency PIN
                </span>
                <input
                  type="password"
                  value={pin}
                  onChange={(event) => {
                    setPin(event.target.value);
                    setError(null);
                  }}
                  autoComplete="off"
                  disabled={inputsDisabled}
                  className="mt-2 w-full rounded-xl border border-violet-500/20 bg-zinc-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50"
                  required
                />
              </label>
              <label className="mt-5 block">
                <span className="text-sm font-medium text-violet-100">
                  New password
                </span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    setError(null);
                  }}
                  autoComplete="new-password"
                  disabled={inputsDisabled}
                  minLength={8}
                  className="mt-2 w-full rounded-xl border border-violet-500/20 bg-zinc-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50"
                  required
                />
              </label>
            </>
          ) : (
            <label className="mt-5 block">
              <span className="text-sm font-medium text-violet-100">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError(null);
                }}
                autoComplete="current-password"
                disabled={inputsDisabled}
                className="mt-2 w-full rounded-xl border border-violet-500/20 bg-zinc-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50"
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
              disabled={submitDisabled || !email.trim()}
              className="text-xs font-medium text-violet-300/80 underline-offset-2 hover:text-violet-100 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              Forgot password?
            </button>
          </p>
        ) : null}

        {magicLinkSent && magicLinkMessage ? (
          <p className="mt-5 rounded-xl bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300 ring-1 ring-emerald-500/20">
            {magicLinkMessage}
          </p>
        ) : null}

        {forgotPasswordSent && forgotPasswordMessage ? (
          <p className="mt-5 rounded-xl bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300 ring-1 ring-emerald-500/20">
            {forgotPasswordMessage}
          </p>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-950/50 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/20"
          >
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
          disabled={submitDisabled}
          className="mt-6 w-full rounded-xl bg-violet-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
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
    </ActivoraLoginLayout>
  );
}
