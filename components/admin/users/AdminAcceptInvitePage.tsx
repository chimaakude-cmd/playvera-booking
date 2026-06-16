"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Logo } from "@/components/branding";
import { LoadingState } from "@/components/club/LoadingState";
import { ADMIN_ROLE_LABELS } from "@/lib/admin-users";
import type { AdminUserRole } from "@/lib/admin-users";

type InviteDetails = { fullName: string; email: string; role: string };

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadInvite() {
      if (!token) { setError("Invite link is missing a token."); setLoading(false); return; }
      try {
        const response = await fetch(`/api/admin/accept-invite?token=${encodeURIComponent(token)}`);
        const payload = (await response.json()) as InviteDetails & { error?: string };
        if (!response.ok) { setError(payload.error ?? "Invite link is invalid or has expired."); return; }
        setInvite({ fullName: payload.fullName, email: payload.email, role: payload.role });
      } catch { setError("Failed to load invite."); } finally { setLoading(false); }
    }
    void loadInvite();
  }, [token]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault(); setError(null);
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/accept-invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) { setError(payload.error ?? "Failed to accept invite."); return; }
      setSuccess(true); setTimeout(() => router.push("/staff-access"), 2000);
    } catch { setError("Failed to accept invite."); } finally { setSubmitting(false); }
  }

  if (loading) return <LoadingState message="Loading invite…" />;
  if (success) return <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center text-sm text-emerald-900"><p className="font-semibold">Account activated</p><p className="mt-2">Redirecting to staff sign-in…</p></div>;
  if (!invite) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-800">{error ?? "Invite link is invalid or has expired."}<p className="mt-4"><Link href="/staff-access" className="font-medium text-violet-700 hover:text-violet-900">Go to staff sign-in</Link></p></div>;
  const roleLabel = invite.role in ADMIN_ROLE_LABELS ? ADMIN_ROLE_LABELS[invite.role as AdminUserRole] : invite.role;
  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="rounded-2xl border border-violet-500/20 bg-zinc-900/80 p-6 shadow-2xl shadow-violet-950/40 backdrop-blur sm:p-8">
      <div className="mb-6 space-y-1 text-center"><p className="text-lg font-semibold text-white">{invite.fullName}</p><p className="text-sm text-violet-200/70">{invite.email}</p><p className="text-xs text-violet-300/60">Role: {roleLabel}</p></div>
      <label className="block"><span className="text-sm font-medium text-violet-100">Password</span><input type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} disabled={submitting} className="mt-1.5 w-full rounded-xl border border-violet-500/20 bg-zinc-950/60 px-4 py-2.5 text-sm text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50" /></label>
      <label className="mt-4 block"><span className="text-sm font-medium text-violet-100">Confirm password</span><input type="password" required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={submitting} className="mt-1.5 w-full rounded-xl border border-violet-500/20 bg-zinc-950/60 px-4 py-2.5 text-sm text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50" /></label>
      {error ? <p className="mt-4 rounded-xl bg-red-950/50 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/20">{error}</p> : null}
      <button type="submit" disabled={submitting} className="mt-6 w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Activating…" : "Activate admin account"}</button>
    </form>
  );
}

export function AdminAcceptInvitePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-violet-950 via-zinc-950 to-zinc-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center"><div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"><Logo size="desktop" /></div><h1 className="mt-6 text-2xl font-bold tracking-tight text-white">Accept admin invite</h1><p className="mt-2 text-sm text-violet-200/70">Set a password to activate your platform admin account</p></div>
        <Suspense fallback={<LoadingState message="Loading invite…" />}><AcceptInviteForm /></Suspense>
      </div>
    </div>
  );
}
