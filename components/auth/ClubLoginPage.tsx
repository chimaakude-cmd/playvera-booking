"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/branding";
import { DevQuickLogin } from "@/components/auth/DevQuickLogin";
import { login } from "@/lib/auth";
import { TEST_ACCOUNTS } from "@/lib/auth/accounts";
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

function CheckIcon() {
  return (
    <svg
      aria-hidden
      className="mt-0.5 h-4 w-4 shrink-0 text-violet-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function DashboardPreview() {
  return (
    <div
      aria-hidden
      className="relative mt-10 hidden overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-violet-950/40 ring-1 ring-white/10 backdrop-blur-sm lg:block"
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <div className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <div className="ml-2 h-2 flex-1 rounded-full bg-white/10" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-3">
          <div className="h-24 rounded-xl bg-gradient-to-br from-violet-500/30 to-violet-700/20 p-3">
            <div className="h-2 w-20 rounded-full bg-white/30" />
            <div className="mt-3 h-2 w-32 rounded-full bg-white/20" />
            <div className="mt-2 h-2 w-24 rounded-full bg-white/15" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 rounded-xl bg-white/10 p-2">
              <div className="h-2 w-12 rounded-full bg-white/25" />
              <div className="mt-2 h-2 w-16 rounded-full bg-white/15" />
            </div>
            <div className="h-16 rounded-xl bg-white/10 p-2">
              <div className="h-2 w-10 rounded-full bg-white/25" />
              <div className="mt-2 h-2 w-14 rounded-full bg-white/15" />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-14 rounded-xl bg-emerald-500/20 p-2">
            <div className="h-2 w-8 rounded-full bg-emerald-200/40" />
            <div className="mt-2 h-2 w-12 rounded-full bg-emerald-200/25" />
          </div>
          <div className="h-14 rounded-xl bg-white/10 p-2">
            <div className="h-2 w-10 rounded-full bg-white/25" />
            <div className="mt-2 h-2 w-14 rounded-full bg-white/15" />
          </div>
          <div className="h-14 rounded-xl bg-white/10 p-2">
            <div className="h-2 w-8 rounded-full bg-white/25" />
            <div className="mt-2 h-2 w-12 rounded-full bg-white/15" />
          </div>
        </div>
      </div>
    </div>
  );
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
  const [email, setEmail] = useState(
    process.env.NODE_ENV !== "production" ? TEST_ACCOUNTS.club.email : "",
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    setHasDraft(hasSavedOnboardingDraft());
  }, []);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const user = login(email, password);
    if (!user) {
      setError("Invalid email or password. Use the test account credentials.");
      return;
    }

    if (user.role !== "club") {
      setError(
        `This account is for ${user.role} access. Use the correct login page.`,
      );
      return;
    }

    router.push(resolveSafeReturnPath(returnTo, CLUB_DASHBOARD_PATH));
  }

  const onboardingHref = returnTo
    ? `/club/onboarding?returnTo=${encodeURIComponent(returnTo)}`
    : "/club/onboarding";

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <section className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-violet-950 via-violet-900/95 to-zinc-950 px-6 py-10 sm:px-10 lg:w-[55%] lg:px-12 lg:py-14 xl:px-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-violet-400/10 blur-3xl"
        />

        <div className="relative">
          <div className="inline-flex rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
            <Logo size="desktop" href="/" />
          </div>

          <h1 className="mt-8 max-w-xl text-3xl font-bold tracking-tight text-white sm:text-4xl xl:text-[2.5rem] xl:leading-tight">
            Run your club. Grow bookings. Save admin time.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-violet-100/80 sm:text-lg">
            Manage sessions, bookings, communication and payments in one place.
          </p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-3">
            {BENEFITS.map((benefit) => (
              <li
                key={benefit}
                className="flex items-start gap-2.5 text-sm text-violet-50/90"
              >
                <CheckIcon />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          <DashboardPreview />
        </div>

        <p className="relative mt-10 hidden text-xs text-violet-200/50 lg:block">
          Trusted by clubs running sessions, camps, and classes on Activora.
        </p>
      </section>

      <section className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-10 sm:px-10 lg:w-[45%] lg:py-14">
        <div className="w-full max-w-[520px]">
          <div className="mb-8 lg:hidden">
            <Logo size="desktop" href="/" />
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
              Club sign in
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              {showSetupWelcome
                ? "Sign in to pick up where you left off."
                : "Welcome back — manage your sessions, bookings, and club profile."}
            </p>
          </div>

          {showSetupWelcome ? (
            <div
              className="mb-6 rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50 to-white px-5 py-4 text-center shadow-sm ring-1 ring-violet-100"
              role="status"
            >
              <p className="text-sm font-medium text-violet-900">
                {SETUP_WELCOME_MESSAGE}
              </p>
            </div>
          ) : null}

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-zinc-200/80 bg-white/90 p-7 shadow-xl shadow-zinc-900/5 backdrop-blur-sm ring-1 ring-zinc-100 sm:p-9"
          >
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
              <span className="text-sm font-medium text-zinc-700">
                Password
              </span>
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
              <p className="mt-5 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="mt-6 w-full rounded-xl bg-violet-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
            >
              Sign in
            </button>

            <div className="mt-6 space-y-3 border-t border-zinc-100 pt-6">
              <p className="text-center text-sm text-zinc-600">
                New to Activora?{" "}
                <Link
                  href={onboardingHref}
                  className="font-semibold text-violet-700 hover:text-violet-900"
                >
                  Create your club →
                </Link>
              </p>

              {hasDraft ? (
                <p className="text-center text-sm text-zinc-600">
                  <Link
                    href={onboardingHref}
                    className="font-semibold text-violet-700 hover:text-violet-900"
                  >
                    Continue where you left off
                  </Link>
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="text-emerald-600">
                  ✓
                </span>
                Free to start
              </span>
              <span className="hidden h-3 w-px bg-zinc-200 sm:inline-block" />
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="text-emerald-600">
                  ✓
                </span>
                No card required
              </span>
              <span className="hidden h-3 w-px bg-zinc-200 sm:inline-block" />
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="text-emerald-600">
                  ✓
                </span>
                Secure login
              </span>
            </div>
          </form>

          <DevQuickLogin accountType="club" />

          <p className="mt-6 text-center text-sm text-zinc-500">
            <Link
              href="/login"
              className="font-medium text-zinc-600 hover:text-zinc-900"
            >
              ← Back to login options
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
