"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ActivoraLoginLayout } from "@/components/auth/ActivoraLoginLayout";
import { PortalLoginErrorAlert } from "@/components/auth/PortalLoginErrorAlert";
import { login } from "@/lib/auth";
import type { PortalLoginErrorKind } from "@/lib/auth/portal-login-messages";
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

  const signupHref = returnTo
    ? `/organisation/signup?returnTo=${encodeURIComponent(returnTo)}`
    : "/organisation/signup";

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const user = login(email, password);
    if (!user) {
      setError("invalidCredentials");
      return;
    }

    if (user.role !== "organisation") {
      setError("wrongPortal");
      return;
    }

    router.push(
      resolveSafeReturnPath(returnTo, ORGANISATION_DASHBOARD_PATH),
    );
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
            onChange={(event) => setEmail(event.target.value)}
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
            onChange={(event) => setPassword(event.target.value)}
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
          className="mt-6 w-full rounded-xl bg-violet-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
        >
          Sign in
        </button>
      </form>
    </ActivoraLoginLayout>
  );
}
