"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ActivoraLoginLayout } from "@/components/auth/ActivoraLoginLayout";
import { PortalLoginErrorAlert } from "@/components/auth/PortalLoginErrorAlert";
import { login, logout } from "@/lib/auth";
import type { PortalLoginErrorKind } from "@/lib/auth/portal-login-messages";
import { usePortalLoginForm } from "@/lib/auth/use-portal-login-form";
import { resolveSafeReturnPath } from "@/lib/booking-flow/redirect";

const BENEFITS = [
  "Multi-location dashboard",
  "Franchisee club oversight",
  "Group reporting & analytics",
  "Payout & fee management",
  "Organisation settings",
] as const;

const ORGANISATION_DASHBOARD_PATH = "/organisation/dashboard";

export function FranchisorLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo =
    searchParams.get("returnTo") ?? searchParams.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<PortalLoginErrorKind | null>(null);
  const { loading, runSubmit } = usePortalLoginForm();

  const signupHref = returnTo
    ? `/organisation/signup?returnTo=${encodeURIComponent(returnTo)}`
    : "/organisation/signup";

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) {
      return;
    }

    void runSubmit(async () => {
      setError(null);

      try {
        const user = login(email, password);
        if (!user) {
          setError("invalidCredentials");
          return;
        }

        if (user.role !== "organisation") {
          logout();
          setError("wrongPortal");
          return;
        }

        router.push(
          resolveSafeReturnPath(returnTo, ORGANISATION_DASHBOARD_PATH),
        );
      } catch {
        setError("invalidCredentials");
      }
    });
  }

  return (
    <ActivoraLoginLayout
      variant="franchisor"
      headline="Manage every location from one dashboard."
      subtext="Oversee franchisee clubs, reporting, payouts and organisation settings."
      benefits={BENEFITS}
      panelFooter="Built for franchisors running multi-site activity networks on Activora."
      cardTitle="Franchisor sign in"
      cardSubtitle="Sign in to manage your franchisee clubs and organisation settings."
      cta={{
        prefix: "No account?",
        label: "Sign up as franchisor →",
        href: signupHref,
      }}
      showDevQuickLogin="organisation"
    >
      <form onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError(null);
            }}
            disabled={loading}
            autoComplete="username"
            className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-500/20"
            required
          />
        </label>

        <label className="mt-5 block">
          <span className="text-sm font-medium text-zinc-700">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError(null);
            }}
            disabled={loading}
            autoComplete="current-password"
            className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-500/20"
            required
          />
        </label>

        {error ? (
          <PortalLoginErrorAlert
            kind={error}
            signupHref={signupHref}
            signupLabel="Create franchisor account"
          />
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-violet-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </ActivoraLoginLayout>
  );
}
