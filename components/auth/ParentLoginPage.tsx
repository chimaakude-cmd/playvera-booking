"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ActivoraLoginLayout } from "@/components/auth/ActivoraLoginLayout";
import { PortalLoginErrorAlert } from "@/components/auth/PortalLoginErrorAlert";
import { login } from "@/lib/auth";
import type { PortalLoginErrorKind } from "@/lib/auth/portal-login-messages";
import { resolveSafeReturnPath } from "@/lib/booking-flow/redirect";

const BENEFITS = [
  "Book sessions & activities",
  "Manage children's profiles",
  "View upcoming bookings",
  "Updates from your clubs",
  "One family account",
] as const;

const PARENT_DASHBOARD_PATH = "/parent/dashboard";

export function ParentLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo =
    searchParams.get("returnTo") ?? searchParams.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<PortalLoginErrorKind | null>(null);

  const signupHref = returnTo
    ? `/parent/signup?returnTo=${encodeURIComponent(returnTo)}`
    : "/parent/signup";

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const user = login(email, password);
    if (!user) {
      setError("invalidCredentials");
      return;
    }

    if (user.role !== "parent") {
      setError("wrongPortal");
      return;
    }

    router.push(resolveSafeReturnPath(returnTo, PARENT_DASHBOARD_PATH));
  }

  return (
    <ActivoraLoginLayout
      variant="parent"
      headline="Book activities. Manage your family. Stay updated."
      subtext="View bookings, manage children's details and keep everything in one place."
      benefits={BENEFITS}
      panelFooter="Join families booking activities and staying connected on Activora."
      cardTitle="Parent sign in"
      cardSubtitle="Access your bookings and family profile."
      cta={{
        prefix: "No account?",
        label: "Sign up →",
        href: signupHref,
      }}
      showDevQuickLogin="parent"
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
            signupLabel="Create account"
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
