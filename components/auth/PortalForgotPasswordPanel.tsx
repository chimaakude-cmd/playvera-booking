"use client";

import { useState } from "react";
import {
  FORGOT_PASSWORD_SUCCESS_MESSAGE,
  loginErrorMessage,
  type LoginErrorKind,
} from "@/lib/auth/login-messages";
import type { PortalLoginRole } from "@/lib/auth/portal-login-server";

type PortalForgotPasswordPanelProps = {
  portal: PortalLoginRole | "admin";
  email: string;
  disabled?: boolean;
  variant?: "light" | "dark";
};

export function PortalForgotPasswordPanel({
  portal,
  email,
  disabled = false,
  variant = "light",
}: PortalForgotPasswordPanelProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const linkClass =
    variant === "dark"
      ? "text-xs font-medium text-violet-300/80 underline-offset-2 hover:text-violet-100 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
      : "text-xs font-medium text-violet-700 underline-offset-2 hover:text-violet-900 hover:underline disabled:cursor-not-allowed disabled:opacity-50";

  const successClass =
    variant === "dark"
      ? "mt-4 rounded-xl bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300 ring-1 ring-emerald-500/20"
      : "mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800";

  const errorClass =
    variant === "dark"
      ? "mt-4 rounded-xl bg-red-950/50 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/20"
      : "mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700";

  async function handleSendReset() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Enter your email above, then request a reset link.");
      setMessage(null);
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, portal }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
        kind?: LoginErrorKind;
      };

      if (!response.ok || payload.error) {
        setError(payload.error ?? loginErrorMessage("generic"));
        return;
      }

      setMessage(payload.message ?? FORGOT_PASSWORD_SUCCESS_MESSAGE);
    } catch {
      setError(loginErrorMessage("generic"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          setError(null);
          setMessage(null);
        }}
        disabled={disabled || submitting}
        className={linkClass}
      >
        Forgot password or can&apos;t access your account?
      </button>

      {open ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => void handleSendReset()}
            disabled={disabled || submitting}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
              variant === "dark"
                ? "bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50"
                : "bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50"
            }`}
          >
            {submitting ? "Sending…" : "Email reset link"}
          </button>

          {message ? (
            <p className={successClass} role="status">{message}</p>
          ) : null}

          {error ? (
            <p className={errorClass} role="alert">{error}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
