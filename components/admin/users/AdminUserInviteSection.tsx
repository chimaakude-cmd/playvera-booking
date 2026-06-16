"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/club/PageHeader";
import { getAdminSession } from "@/lib/admin";
import {
  ADMIN_ROLE_LABELS,
  adminActorHeaders,
  buildAdminInviteLink,
  canManageAdminUsers,
  getInviteDeliveryNote,
  INVITABLE_ADMIN_ROLES,
  type AdminUserRole,
} from "@/lib/admin-users";

export function AdminUserInviteSection() {
  const router = useRouter();
  const session = getAdminSession();
  const canManage = session ? canManageAdminUsers(session.role) : false;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<AdminUserRole, "owner">>("support_admin");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!canManage || !session) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        Only Owner or Super Admin can invite admin users.
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!session) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setInviteLink(null);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...adminActorHeaders({
            adminId: session.adminId,
            email: session.email,
            name: session.name,
            role: session.role,
          }),
        },
        body: JSON.stringify({ name, email, role }),
      });

      const payload = (await response.json()) as {
        inviteLink?: string;
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Failed to send invite.");
        return;
      }

      setInviteLink(payload.inviteLink ?? buildAdminInviteLink("pending"));
      setName("");
      setEmail("");
    } catch {
      setError("Failed to send invite.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopyLink() {
    if (!inviteLink) {
      return;
    }
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Only give admin access to trusted staff.
      </div>

      <PageHeader
        title="Invite admin user"
        description="Send a secure invite link by email or copy it manually."
        action={
          <Link
            href="/admin/users"
            className="text-sm font-medium text-violet-700 hover:text-violet-900"
          >
            Back to list
          </Link>
        }
      />

      <form
        onSubmit={handleSubmit}
        className="max-w-xl space-y-5 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm"
      >
        <p className="text-sm text-zinc-500">{getInviteDeliveryNote()}</p>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-zinc-700">Full name</span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none ring-violet-500 focus:ring-2"
            placeholder="Jane Smith"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-zinc-700">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none ring-violet-500 focus:ring-2"
            placeholder="jane@activora.co.uk"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-zinc-700">Role</span>
          <select
            value={role}
            onChange={(event) =>
              setRole(event.target.value as Exclude<AdminUserRole, "owner">)
            }
            className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none ring-violet-500 focus:ring-2"
          >
            {INVITABLE_ADMIN_ROLES.map((item) => (
              <option key={item} value={item}>
                {ADMIN_ROLE_LABELS[item]}
              </option>
            ))}
          </select>
        </label>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {inviteLink ? (
          <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-medium text-emerald-900">Invite created</p>
            <p className="break-all rounded-lg bg-white px-3 py-2 font-mono text-xs text-zinc-700 ring-1 ring-emerald-100">
              {inviteLink}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleCopyLink()}
                className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800"
              >
                {copied ? "Copied" : "Copy invite link"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/admin/users")}
                className="rounded-lg border border-emerald-300 px-3 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-100"
              >
                View all users
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {submitting ? "Sending…" : "Send invite"}
          </button>
          <Link
            href="/admin/users"
            className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
