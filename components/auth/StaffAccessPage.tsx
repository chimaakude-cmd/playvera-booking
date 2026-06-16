"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/branding";
import { TEST_ACCOUNTS } from "@/lib/auth/accounts";
import {
  getStaffAccessLockoutRemainingMs,
  isStaffAccessLocked,
  staffAccessLogin,
} from "@/lib/auth/staff-access";

function formatLockoutRemaining(ms: number): string {
  const minutes = Math.ceil(ms / 60_000);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

export function StaffAccessPage() {
  const router = useRouter();
  const [email, setEmail] = useState(
    process.env.NODE_ENV !== "production" ? TEST_ACCOUNTS.admin.email : "",
  );
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(isStaffAccessLocked());

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

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
          <label className="block">
            <span className="text-sm font-medium text-violet-100">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              disabled={locked}
              className="mt-1.5 w-full rounded-xl border border-violet-500/20 bg-zinc-950/60 px-4 py-2.5 text-sm text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50"
              required
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-violet-100">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              disabled={locked}
              className="mt-1.5 w-full rounded-xl border border-violet-500/20 bg-zinc-950/60 px-4 py-2.5 text-sm text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50"
              required
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-violet-100">
              2FA code
            </span>
            <input
              type="text"
              value={twoFactorCode}
              onChange={(event) => setTwoFactorCode(event.target.value)}
              placeholder="Coming soon"
              disabled
              className="mt-1.5 w-full rounded-xl border border-violet-500/10 bg-zinc-950/40 px-4 py-2.5 text-sm text-zinc-500 outline-none"
            />
            <p className="mt-1 text-xs text-violet-300/50">
              Two-factor authentication will be required in production.
            </p>
          </label>

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
            disabled={locked}
            className="mt-6 w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
