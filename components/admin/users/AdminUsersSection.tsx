"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/club/PageHeader";
import { LoadingState } from "@/components/club/LoadingState";
import { getAdminSession } from "@/lib/admin";
import {
  ADMIN_ROLE_LABELS,
  ADMIN_USER_STATUS_LABELS,
  adminActorHeaders,
  canManageAdminUsers,
  formatAdminLastLogin,
  type AdminUserPublic,
} from "@/lib/admin-users";
import { syncAdminUsersFromServer } from "@/lib/admin-users/storage";

function StatusBadge({ status }: { status: AdminUserPublic["status"] }) {
  const styles =
    status === "active"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "invited"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-zinc-100 text-zinc-600 ring-zinc-200";

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles}`}>
      {ADMIN_USER_STATUS_LABELS[status]}
    </span>
  );
}

function RoleBadge({ role }: { role: AdminUserPublic["role"] }) {
  const styles =
    role === "owner"
      ? "bg-violet-50 text-violet-700 ring-violet-200"
      : role === "super_admin"
        ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
        : role === "finance_admin"
          ? "bg-teal-50 text-teal-700 ring-teal-200"
          : role === "content_admin"
            ? "bg-orange-50 text-orange-700 ring-orange-200"
            : "bg-sky-50 text-sky-700 ring-sky-200";

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles}`}>
      {ADMIN_ROLE_LABELS[role]}
    </span>
  );
}

export function AdminUsersSection() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUserPublic[]>([]);
  const [error, setError] = useState<string | null>(null);
  const session = getAdminSession();
  const canManage = session ? canManageAdminUsers(session.role) : false;

  useEffect(() => {
    async function loadUsers() {
      if (!session || !canManage) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/admin/users", {
          headers: adminActorHeaders({
            adminId: session.adminId,
            email: session.email,
            name: session.name,
            role: session.role,
          }),
        });
        const payload = (await response.json()) as {
          users?: AdminUserPublic[];
          error?: string;
        };

        if (!response.ok) {
          setError(payload.error ?? "Failed to load admin users.");
          return;
        }

        const nextUsers = payload.users ?? [];
        setUsers(nextUsers);
        syncAdminUsersFromServer(nextUsers);
      } catch {
        setError("Failed to load admin users.");
      } finally {
        setLoading(false);
      }
    }

    void loadUsers();
  }, [canManage, session]);

  const activeCount = useMemo(
    () => users.filter((user) => user.status === "active").length,
    [users],
  );
  const invitedCount = useMemo(
    () => users.filter((user) => user.status === "invited").length,
    [users],
  );

  if (loading) {
    return <LoadingState message="Loading admin users…" />;
  }

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        Only Owner or Super Admin can manage platform admin users.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Only give admin access to trusted staff.
      </div>

      <PageHeader
        title="Admin Users"
        description="Manage platform team access, roles, and invites."
        action={
          <Link
            href="/admin/users/invite"
            className="inline-flex items-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
          >
            Invite admin
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Total users</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">{users.length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Active</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Pending invites</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">{invitedCount}</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        {users.length === 0 && !error ? (
          <div className="px-6 py-12 text-center text-sm text-zinc-500">
            No admin users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-600">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-600">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-600">Role</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-600">Last login</th>
                  <th className="px-4 py-3 text-right font-semibold text-zinc-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-50/80">
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {user.name}
                      {user.isOwner ? (
                        <span className="ml-2 text-xs font-normal text-violet-600">Owner</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {formatAdminLastLogin(user.lastLoginAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="font-medium text-violet-700 hover:text-violet-900"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
