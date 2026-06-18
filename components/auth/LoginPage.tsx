"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/branding";
import { DevQuickLogin } from "@/components/auth/DevQuickLogin";
import { login, type UserRole } from "@/lib/auth";
import { resolveSafeReturnPath } from "@/lib/booking-flow/redirect";

type LoginPageProps = {
  role: Extract<UserRole, "parent" | "club" | "admin" | "organisation">;
  title: string;
  subtitle: string;
  signupHref?: string;
  signupLabel?: string;
  defaultEmail?: string;
  backHref?: string;
  backLabel?: string;
};

const DASHBOARD_PATHS: Record<LoginPageProps["role"], string> = {
  parent: "/parent/dashboard",
  club: "/club/dashboard",
  admin: "/admin/dashboard",
  organisation: "/organisation/dashboard",
};

export function LoginPage({
  role,
  title,
  subtitle,
  signupHref,
  signupLabel = "Sign up",
  defaultEmail = "",
  backHref = "/login",
  backLabel = "← Back to login options",
}: LoginPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo =
    searchParams.get("returnTo") ?? searchParams.get("next");
  const [email, setEmail] = useState(
    process.env.NODE_ENV !== "production" ? defaultEmail : "",
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const user = login(email, password);
    if (!user) {
      setError("Invalid email or password. Use the test account credentials.");
      return;
    }

    if (user.role !== role) {
      setError(`This account is for ${user.role} access. Use the correct login page.`);
      return;
    }

    router.push(
      resolveSafeReturnPath(returnTo, DASHBOARD_PATHS[role]),
    );
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-[#f6f7f9] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size="desktop" />
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900">
            {title}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8"
        >
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-500/20"
              required
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-zinc-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-500/20"
              required
            />
          </label>

          {error ? (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="mt-6 w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Sign in
          </button>

          {signupHref ? (
            <p className="mt-4 text-center text-sm text-zinc-500">
              No account?{" "}
              <Link
                href={
                  returnTo
                    ? `${signupHref}?returnTo=${encodeURIComponent(returnTo)}`
                    : signupHref
                }
                className="font-medium text-violet-700 hover:text-violet-900"
              >
                {signupLabel}
              </Link>
            </p>
          ) : null}
        </form>

        <DevQuickLogin accountType={role} />

        <p className="mt-6 text-center text-sm text-zinc-500">
          <Link href={backHref} className="font-medium text-zinc-600 hover:text-zinc-900">
            {backLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}
