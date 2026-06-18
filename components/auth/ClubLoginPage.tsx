"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ActivoraLoginLayout } from "@/components/auth/ActivoraLoginLayout";
import { ClubLoginErrorAlert } from "@/components/auth/ClubLoginErrorAlert";
import { login } from "@/lib/auth";
import type { ClubLoginErrorKind } from "@/lib/auth/club-login-messages";
import { resolveSafeReturnPath } from "@/lib/booking-flow/redirect";
import { loadOnboardingDraft } from "@/lib/club-onboarding/storage";

const BENEFITS = [
  "Accept bookings online",
  "Parent communication",
  "Session management",
  "Reporting & analytics",
  "Upgrade when ready",
] as const;

const CLUB_DASHBOARD_PATH = "/club/dashboard";
const SETUP_WELCOME_MESSAGE = "Welcome back — your club setup is waiting.";

function shouldShowSetupWelcome(
  searchParams: URLSearchParams,
  returnTo: string | null,
): boolean {
  if (searchParams.get("setup") === "1") {
    return true;
  }

  if (searchParams.get("from") === "onboarding") {
    return true;
  }

  const nextPath = returnTo ?? "";
  if (nextPath.includes(CLUB_DASHBOARD_PATH)) {
    return true;
  }

  return false;
}

function hasSavedOnboardingDraft(): boolean {
  const draft = loadOnboardingDraft();
  return (
    draft.currentStep > 1 ||
    draft.owner.email.trim() !== "" ||
    draft.club.name.trim() !== "" ||
    draft.completedAt !== null
  );
}

export function ClubLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo =
    searchParams.get("returnTo") ?? searchParams.get("next");
  const showSetupWelcome = shouldShowSetupWelcome(searchParams, returnTo);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<ClubLoginErrorKind | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    setHasDraft(hasSavedOnboardingDraft());
  }, []);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const user = login(email, password);
    if (!user) {
      setError("invalidCredentials");
      return;
    }

    if (user.role !== "club") {
      setError("notFound");
      return;
    }

    router.push(resolveSafeReturnPath(returnTo, CLUB_DASHBOARD_PATH));
  }

  const onboardingHref = returnTo
    ? `/club/onboarding?returnTo=${encodeURIComponent(returnTo)}`
    : "/club/onboarding";

  return (
    <ActivoraLoginLayout
      variant="club"
      headline="Run your club. Grow bookings. Save admin time."
      subtext="Manage sessions, bookings, communication and payments in one place."
      benefits={BENEFITS}
      panelFooter="Trusted by clubs running sessions, camps, and classes on Activora."
      showDashboardPreview
      cardTitle="Club sign in"
      cardSubtitle={
        showSetupWelcome
          ? "Sign in to pick up where you left off."
          : "Welcome back — manage your sessions, bookings, and club profile."
      }
      cardBanner={
        showSetupWelcome ? (
          <div
            className="mb-6 rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50 to-white px-5 py-4 text-center shadow-sm ring-1 ring-violet-100"
            role="status"
          >
            <p className="text-sm font-medium text-violet-900">
              {SETUP_WELCOME_MESSAGE}
            </p>
          </div>
        ) : null
      }
      cta={{
        prefix: "New to Activora?",
        label: "Create your club →",
        href: onboardingHref,
      }}
      footerLinks={
        hasDraft ? (
          <p className="mt-3 text-center text-sm text-zinc-600">
            <Link
              href={onboardingHref}
              className="font-semibold text-violet-700 hover:text-violet-900"
            >
              Continue where you left off
            </Link>
          </p>
        ) : null
      }
      showDevQuickLogin="club"
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
          <ClubLoginErrorAlert kind={error} onboardingHref={onboardingHref} />
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
