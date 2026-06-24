"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/club/PageHeader";
import { LoadingState } from "@/components/club/LoadingState";
import { InviteStaffModal } from "./InviteStaffModal";
import {
  cancelTeamInvite,
  changeMemberRole,
  CLUB_ROLE_LABELS,
  getClubTeamState,
  getCurrentClubRole,
  getMemberFullName,
  getOwnerMember,
  INVITABLE_ROLES,
  inviteStaffMember,
  removeTeamMember,
  resendTeamInvite,
  roleHasPermission,
  syncClubTeamFromServer,
  type ClubRole,
  type ClubTeamState,
  type InviteStaffInput,
  formatLastActive,
} from "@/lib/club-team";
import {
  formatMonthlyPrice,
  getPlanByIdOrDefault,
  getPlanLabel,
} from "@/src/config/pricing";
import { getProviderSubscription } from "@/lib/provider-subscription";

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

function RoleBadge({ role }: { role: ClubRole }) {
  const styles =
    role === "owner"
      ? "bg-violet-50 text-violet-700 ring-violet-200"
      : role === "manager"
        ? "bg-teal-50 text-teal-700 ring-teal-200"
        : role === "administrator"
          ? "bg-sky-50 text-sky-700 ring-sky-200"
          : "bg-zinc-100 text-zinc-700 ring-zinc-200";

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles}`}>
      {CLUB_ROLE_LABELS[role]}
    </span>
  );
}

export function TeamAccessPage() {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<ClubTeamState | null>(null);
  const [planLabel, setPlanLabel] = useState(getPlanLabel("STARTER"));
  const [planPrice, setPlanPrice] = useState(formatMonthlyPrice(getPlanByIdOrDefault("STARTER")));
  const [inviteOpen, setInviteOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const currentRole = getCurrentClubRole();
  const canInvite = roleHasPermission(currentRole, "invite_staff");
  const canManageTeam = roleHasPermission(currentRole, "manage_team");

  useEffect(() => {
    let cancelled = false;

    async function loadTeam() {
      const team = await syncClubTeamFromServer();
      if (!cancelled) {
        setState(team);
        const subscription = getProviderSubscription();
        const plan = getPlanByIdOrDefault(subscription.planId);
        setPlanLabel(getPlanLabel(plan.id));
        setPlanPrice(formatMonthlyPrice(plan));
        setLoading(false);
      }
    }

    void loadTeam();

    return () => {
      cancelled = true;
    };
  }, []);

  const owner = useMemo(
    () => (state ? getOwnerMember(state) : null),
    [state],
  );

  const pendingInvites = state?.invites.filter((invite) => invite.status === "pending") ?? [];

  const tableRows = useMemo(() => {
    if (!state) {
      return [];
    }

    const members = state.members.map((member) => ({
      id: member.id,
      name: getMemberFullName(member),
      email: member.email,
      role: member.role,
      status: member.status === "active" ? "Active" : "Pending",
      lastActive: formatLastActive(member.lastActiveAt),
      type: "member" as const,
      isOwner: member.isOwner,
    }));

    const invites = pendingInvites.map((invite) => ({
      id: invite.id,
      name: getMemberFullName(invite),
      email: invite.email,
      role: invite.role,
      status: "Invited",
      lastActive: "—",
      type: "invite" as const,
      isOwner: false,
    }));

    return [...members, ...invites];
  }, [state, pendingInvites]);

  function refresh() {
    void syncClubTeamFromServer().then(setState);
  }

  function handleInvite(input: InviteStaffInput) {
    inviteStaffMember(input);
    setMessage(`Invite sent to ${input.email} (stubbed).`);
    refresh();
  }

  function handleChangeRole(memberId: string, role: ClubRole) {
    try {
      changeMemberRole(memberId, role);
      setMessage("Role updated.");
      refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not change role.");
    }
  }

  function handleRemove(memberId: string) {
    try {
      removeTeamMember(memberId);
      setMessage("Team member removed.");
      refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove member.");
    }
  }

  function handleResend(inviteId: string) {
    resendTeamInvite(inviteId);
    setMessage("Invite resent (stubbed).");
    refresh();
  }

  function handleCancelInvite(inviteId: string) {
    cancelTeamInvite(inviteId);
    setMessage("Invite cancelled.");
    refresh();
  }

  if (loading || !state || !owner) {
    return <LoadingState message="Loading team access..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account & team access"
        description="Invite staff and assign standardised roles across your club."
        action={
          canInvite ? (
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              Invite staff member
            </button>
          ) : null
        }
      />

      {message ? (
        <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Current plan"
          value={planLabel}
          hint={`${planPrice} · Manage in Settings → Subscription`}
        />
        <SummaryCard
          label="Team members"
          value={String(state.members.length)}
          hint="Active staff on this club"
        />
        <SummaryCard
          label="Pending invites"
          value={String(pendingInvites.length)}
          hint="Awaiting acceptance"
        />
        <SummaryCard
          label="Owner"
          value={getMemberFullName(owner)}
          hint={owner.email}
        />
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h2 className="text-base font-semibold text-zinc-900">Team members</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Roles are fixed across every Activora club.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-400">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Last active</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr key={`${row.type}-${row.id}`} className="border-b border-zinc-50">
                  <td className="px-5 py-4 font-medium text-zinc-900">{row.name}</td>
                  <td className="px-5 py-4 text-zinc-600">{row.email}</td>
                  <td className="px-5 py-4">
                    <RoleBadge role={row.role} />
                  </td>
                  <td className="px-5 py-4 text-zinc-600">{row.status}</td>
                  <td className="px-5 py-4 text-zinc-600">{row.lastActive}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {row.type === "member" && canManageTeam && !row.isOwner ? (
                        <>
                          <select
                            value={row.role}
                            onChange={(event) =>
                              handleChangeRole(
                                row.id,
                                event.target.value as ClubRole,
                              )
                            }
                            className="rounded-lg border border-zinc-200 px-2 py-1 text-xs"
                          >
                            {INVITABLE_ROLES.map((option) => (
                              <option key={option} value={option}>
                                {CLUB_ROLE_LABELS[option]}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleRemove(row.id)}
                            className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-700"
                          >
                            Remove
                          </button>
                        </>
                      ) : null}
                      {row.type === "invite" && canManageTeam ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleResend(row.id)}
                            className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-semibold text-zinc-700"
                          >
                            Resend invite
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelInvite(row.id)}
                            className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-semibold text-zinc-700"
                          >
                            Cancel invite
                          </button>
                        </>
                      ) : null}
                      {row.isOwner ? (
                        <span className="text-xs text-zinc-400">Owner account</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-zinc-900">Role permissions</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {(["coach", "administrator", "manager", "owner"] as ClubRole[]).map(
            (role) => (
              <div
                key={role}
                className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-4"
              >
                <div className="flex items-center gap-2">
                  <RoleBadge role={role} />
                </div>
                <p className="mt-3 text-xs leading-6 text-zinc-600">
                  {role === "coach"
                    ? "Register and safeguarding access for assigned sessions only."
                    : role === "administrator"
                      ? "Operations, profile, and promotion without billing control."
                      : role === "manager"
                        ? "Full club operations and team invites, excluding subscription changes."
                        : "Full access including billing, ownership, and account closure."}
                </p>
              </div>
            ),
          )}
        </div>
      </section>

      <InviteStaffModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSubmit={handleInvite}
      />
    </div>
  );
}
