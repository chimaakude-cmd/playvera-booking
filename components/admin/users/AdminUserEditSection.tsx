"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/club/PageHeader";
import { LoadingState } from "@/components/club/LoadingState";
import { getAdminSession } from "@/lib/admin";
import {
  ADMIN_ROLE_LABELS,
  ADMIN_USER_STATUS_LABELS,
  adminActorHeaders,
  buildAdminInviteLink,
  canDisableAdminUser,
  canEditAdminUser,
  canManageAdminUsers,
  formatAdminLastLogin,
  INVITABLE_ADMIN_ROLES,
  type AdminUserAuditEntry,
  type AdminUserPublic,
  type AdminUserRole,
} from "@/lib/admin-users";

type AdminUserEditSectionProps = {
  userId: string;
};

function auditActionLabel(action: AdminUserAuditEntry["action"]): string {
  switch (action) {
    case "invite_sent":
      return "Invite sent";
    case "invite_resent":
      return "Invite resent";
    case "password_changed":
      return "Password changed";
    case "email_changed":
      return "Email changed";
    case "role_changed":
      return "Role changed";
    case "access_disabled":
      return "Access disabled";
    case "email_verified":
      return "Email verified";
    default:
      return action;
  }
}

export function AdminUserEditSection({ userId }: AdminUserEditSectionProps) {
  const session = getAdminSession();
  const canManage = session ? canManageAdminUsers(session.role) : false;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AdminUserPublic | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminUserRole>("support_admin");
  const [emailVerified, setEmailVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [audit, setAudit] = useState<AdminUserAuditEntry[]>([]);

  const actorHeaders = session
    ? adminActorHeaders({
        adminId: session.adminId,
        email: session.email,
        name: session.name,
        role: session.role,
      })
    : {};

  useEffect(() => {
    async function loadUser() {
      if (!session || !canManage) {
        setLoading(false);
        return;
      }

      try {
        const [userResponse, auditResponse] = await Promise.all([
          fetch(`/api/admin/users/${userId}`, { headers: actorHeaders }),
          fetch("/api/admin/users/audit", { headers: actorHeaders }),
        ]);

        const payload = (await userResponse.json()) as {
          user?: AdminUserPublic;
          error?: string;
        };

        if (!userResponse.ok || !payload.user) {
          setError(payload.error ?? "Admin user not found.");
          return;
        }

        setUser(payload.user);
        setName(payload.user.name);
        setEmail(payload.user.email);
        setRole(payload.user.role);
        setEmailVerified(payload.user.emailVerified);

        if (auditResponse.ok) {
          const auditPayload = (await auditResponse.json()) as {
            audit?: AdminUserAuditEntry[];
          };
          setAudit(
            (auditPayload.audit ?? []).filter(
              (entry) => entry.targetUserId === payload.user!.id,
            ),
          );
        }
      } catch {
        setError("Failed to load admin user.");
      } finally {
        setLoading(false);
      }
    }

    void loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage, userId]);

  async function refreshAudit() {
    if (!session) {
      return;
    }
    const auditResponse = await fetch("/api/admin/users/audit", {
      headers: actorHeaders,
    });
    if (!auditResponse.ok) {
      return;
    }
    const auditPayload = (await auditResponse.json()) as {
      audit?: AdminUserAuditEntry[];
    };
    setAudit(
      (auditPayload.audit ?? []).filter((entry) => entry.targetUserId === userId),
    );
  }

  if (loading) {
    return <LoadingState message="Loading admin user…" />;
  }

  if (!canManage || !session) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        Only Owner or Super Admin can edit admin users.
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        {error ?? "Admin user not found."}
      </div>
    );
  }

  const canEdit = canEditAdminUser(session.role, user);
  const canDisable = canDisableAdminUser(session.role, user);
  const roleOptions: AdminUserRole[] = user.isOwner
    ? ["owner"]
    : session.role === "owner"
      ? ["owner", ...INVITABLE_ADMIN_ROLES]
      : [...INVITABLE_ADMIN_ROLES];

  async function patchUser(body: Record<string, unknown>) {
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...actorHeaders,
        },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as {
        user?: AdminUserPublic;
        error?: string;
      };

      if (!response.ok || !payload.user) {
        setError(payload.error ?? "Update failed.");
        return;
      }

      setUser(payload.user);
      await refreshAudit();
      setMessage("Changes saved.");
      setPassword("");
    } catch {
      setError("Update failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!canEdit) {
      return;
    }

    await patchUser({
      name,
      email,
      role,
      emailVerified,
      ...(password.trim() ? { password: password.trim() } : {}),
    });
  }

  async function handleResendInvite() {
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}/resend-invite`, {
        method: "POST",
        headers: actorHeaders,
      });
      const payload = (await response.json()) as {
        inviteLink?: string;
        user?: AdminUserPublic;
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Failed to resend invite.");
        return;
      }

      if (payload.user) {
        setUser(payload.user);
      }
      setInviteLink(payload.inviteLink ?? null);
      await refreshAudit();
      setMessage("Invite resent.");
    } catch {
      setError("Failed to resend invite.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDisableAccess() {
    if (!canDisable || !window.confirm("Disable access for this admin user?")) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: actorHeaders,
      });
      const payload = (await response.json()) as {
        user?: AdminUserPublic;
        error?: string;
      };

      if (!response.ok || !payload.user) {
        setError(payload.error ?? "Failed to disable access.");
        return;
      }

      setUser(payload.user);
      await refreshAudit();
      setMessage("Access disabled.");
    } catch {
      setError("Failed to disable access.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Only give admin access to trusted staff.
      </div>

      <PageHeader
        title={user.name}
        description={`${ADMIN_ROLE_LABELS[user.role]} · ${ADMIN_USER_STATUS_LABELS[user.status]}`}
        action={
          <Link
            href="/admin/users"
            className="text-sm font-medium text-violet-700 hover:text-violet-900"
          >
            Back to list
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form
          onSubmit={(event) => void handleSave(event)}
          className="space-y-5 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-700">Full name</span>
              <input
                required
                disabled={!canEdit}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none ring-violet-500 focus:ring-2 disabled:bg-zinc-50"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-700">Email</span>
              <input
                required
                type="email"
                disabled={!canEdit}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none ring-violet-500 focus:ring-2 disabled:bg-zinc-50"
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-zinc-700">Role</span>
            <select
              disabled={!canEdit}
              value={role}
              onChange={(event) => setRole(event.target.value as AdminUserRole)}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none ring-violet-500 focus:ring-2 disabled:bg-zinc-50"
            >
              {roleOptions.map((item) => (
                <option key={item} value={item}>
                  {ADMIN_ROLE_LABELS[item]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={emailVerified}
              onChange={(event) => setEmailVerified(event.target.checked)}
              className="rounded border-zinc-300"
            />
            Mark email as verified
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-zinc-700">
              Reset password
            </span>
            <input
              type="password"
              disabled={!canEdit}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Leave blank to keep current password"
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none ring-violet-500 focus:ring-2 disabled:bg-zinc-50"
            />
            <p className="text-xs text-zinc-500">
              Passwords are hashed server-side and never stored in plain text.
            </p>
          </label>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          ) : null}
          {message ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {message}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={!canEdit || submitting}
              className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              Save changes
            </button>
            {user.status === "invited" ? (
              <button
                type="button"
                disabled={!canEdit || submitting}
                onClick={() => void handleResendInvite()}
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
              >
                Resend invite
              </button>
            ) : null}
            {canDisable && user.status !== "disabled" ? (
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleDisableAccess()}
                className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                Disable access
              </button>
            ) : null}
          </div>

          {inviteLink ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
              <p className="font-medium text-emerald-900">Invite link</p>
              <p className="mt-2 break-all font-mono text-xs text-zinc-700">{inviteLink}</p>
            </div>
          ) : user.status === "invited" && user.inviteSentAt ? (
            <p className="text-xs text-zinc-500">
              Last invite sent {formatAdminLastLogin(user.inviteSentAt)}. Use resend to
              generate a fresh link: {buildAdminInviteLink("…")}
            </p>
          ) : null}
        </form>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">Account details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-zinc-500">Status</dt>
                <dd className="font-medium text-zinc-900">
                  {ADMIN_USER_STATUS_LABELS[user.status]}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Last login</dt>
                <dd className="font-medium text-zinc-900">
                  {formatAdminLastLogin(user.lastLoginAt)}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Email verified</dt>
                <dd className="font-medium text-zinc-900">
                  {user.emailVerified ? "Yes" : "No"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">Audit log</h2>
            {audit.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">No audit entries yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {audit.slice(0, 8).map((entry) => (
                  <li key={entry.id} className="text-sm">
                    <p className="font-medium text-zinc-900">
                      {auditActionLabel(entry.action)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {entry.actorName} ·{" "}
                      {new Date(entry.createdAt).toLocaleString("en-GB")}
                    </p>
                    {entry.details ? (
                      <p className="text-xs text-zinc-600">{entry.details}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
