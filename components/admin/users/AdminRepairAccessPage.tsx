"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/branding";

export function AdminRepairAccessForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/repair-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const payload = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Failed to repair admin access.");
        return;
      }

      router.push("/admin/login");
    } catch {
      setError("Failed to repair admin access.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="rounded-2xl border border-violet-500/20 bg-zinc-900/80 p-6 shadow-2xl shadow-violet-950/40 backdrop-blur sm:p-8"
    >
      <p className="mb-6 text-center text-sm text-violet-200/70">
        Set a new password for emergency admin recovery.
      </p>

      <label className="block">
        <span className="text-sm font-medium text-violet-100">New password</span>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={submitting}
          autoComplete="new-password"
          className="mt-1.5 w-full rounded-xl border border-violet-500/20 bg-zinc-950/60 px-4 py-2.5 text-sm text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50"
        />
      </label>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-violet-100">Confirm password</span>
        <input
          type="password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          disabled={submitting}
          autoComplete="new-password"
          className="mt-1.5 w-full rounded-xl border border-violet-500/20 bg-zinc-950/60 px-4 py-2.5 text-sm text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50"
        />
      </label>

      {error ? (
        <p className="mt-4 rounded-xl bg-red-950/50 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/20">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Repairing access…" : "Repair admin access"}
      </button>
    </form>
  );
}

export function AdminRepairAccessInvalid() {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-950/30 p-6 text-center text-sm text-red-300">
      <p>This repair link is invalid or has expired.</p>
      <p className="mt-4">
        <Link
          href="/admin/login"
          className="font-medium text-violet-200 hover:text-white"
        >
          Go to admin sign-in
        </Link>
      </p>
    </div>
  );
}

export function AdminRepairAccessPageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-violet-950 via-zinc-950 to-zinc-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <Logo size="desktop" />
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-white">
            Repair admin access
          </h1>
          <p className="mt-2 text-sm text-violet-200/70">
            Emergency account recovery
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
