"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/club/PageHeader";
import {
  createFranchiseeClub,
  FRANCHISEE_SETTING_LABELS,
  getFranchiseeClubs,
  getPermissionPolicy,
  removeFranchiseeClub,
  suspendFranchiseeClub,
  updateFranchiseeClub,
  updatePermissionPolicy,
  type FranchiseeClub,
  type FranchiseeClubInput,
  type FranchiseeEditableSetting,
  type OrganisationPermissionPolicy,
} from "@/lib/organisation";

function formatCurrency(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(pence / 100);
}

function StatusBadge({ status }: { status: FranchiseeClub["status"] }) {
  const styles = {
    active: "bg-emerald-50 text-emerald-700",
    pending: "bg-amber-50 text-amber-700",
    suspended: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function StripeBadge({ status }: { status: FranchiseeClub["stripeStatus"] }) {
  const labels = {
    connected: "Connected",
    pending: "Pending",
    not_connected: "Not connected",
  };

  return (
    <span className="text-xs text-zinc-600">{labels[status]}</span>
  );
}

type ClubFormModalProps = {
  open: boolean;
  initial?: FranchiseeClub;
  onClose: () => void;
  onSave: (input: FranchiseeClubInput) => void;
};

function ClubFormModal({ open, initial, onClose, onSave }: ClubFormModalProps) {
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setArea(initial?.area ?? "");
      setManagerName(initial?.managerName ?? "");
      setManagerEmail(initial?.managerEmail ?? "");
    }
  }, [open, initial]);

  if (!open) {
    return null;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSave({ name, area, managerName, managerEmail });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold text-zinc-900">
          {initial ? "Edit franchisee club" : "Create franchisee club"}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Add a new location under your organisation. The club manager can be
          invited later.
        </p>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Club name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Area / location</span>
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Club owner / manager</span>
            <input
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Manager email</span>
            <input
              type="email"
              value={managerEmail}
              onChange={(e) => setManagerEmail(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800"
          >
            {initial ? "Save changes" : "Create club"}
          </button>
        </div>
      </form>
    </div>
  );
}

function PermissionToggles({
  policy,
  onChange,
}: {
  policy: OrganisationPermissionPolicy;
  onChange: (policy: OrganisationPermissionPolicy) => void;
}) {
  const settings = Object.keys(
    policy.franchiseeCanEdit,
  ) as FranchiseeEditableSetting[];

  function toggle(setting: FranchiseeEditableSetting) {
    onChange({
      ...policy,
      franchiseeCanEdit: {
        ...policy.franchiseeCanEdit,
        [setting]: !policy.franchiseeCanEdit[setting],
      },
    });
  }

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-zinc-900">
        Franchisee permission policy
      </h3>
      <p className="mt-1 text-xs text-zinc-500">
        Control what franchisee club managers can edit in their club dashboard.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {settings.map((setting) => (
          <label
            key={setting}
            className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/50 px-4 py-3"
          >
            <span className="text-sm text-zinc-700">
              {FRANCHISEE_SETTING_LABELS[setting]}
            </span>
            <input
              type="checkbox"
              checked={policy.franchiseeCanEdit[setting]}
              onChange={() => toggle(setting)}
              className="h-4 w-4 rounded border-zinc-300 text-violet-600"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

export default function OrganisationClubsPage() {
  const [clubs, setClubs] = useState<FranchiseeClub[]>([]);
  const [policy, setPolicy] = useState<OrganisationPermissionPolicy | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<FranchiseeClub | undefined>();

  function refresh() {
    setClubs(getFranchiseeClubs());
    setPolicy(getPermissionPolicy());
  }

  useEffect(() => {
    refresh();
  }, []);

  function handleSave(input: FranchiseeClubInput) {
    if (editingClub) {
      updateFranchiseeClub(editingClub.id, input);
    } else {
      createFranchiseeClub(input);
    }
    refresh();
    setEditingClub(undefined);
  }

  function handlePolicyChange(next: OrganisationPermissionPolicy) {
    setPolicy(updatePermissionPolicy(next.franchiseeCanEdit));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Franchisee clubs"
        description="Create and manage franchisee clubs across your organisation. Franchisees don't always need to self-signup."
        action={
          <button
            type="button"
            onClick={() => {
              setEditingClub(undefined);
              setModalOpen(true);
            }}
            className="inline-flex rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-800"
          >
            Create franchisee club
          </button>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50/80 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Club name</th>
                <th className="px-4 py-3 font-semibold">Area</th>
                <th className="px-4 py-3 font-semibold">Owner / manager</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Stripe</th>
                <th className="px-4 py-3 font-semibold">Bookings</th>
                <th className="px-4 py-3 font-semibold">Revenue</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {clubs.map((club) => (
                <tr key={club.id} className="hover:bg-zinc-50/50">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {club.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{club.area}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-800">{club.managerName}</p>
                    <p className="text-xs text-zinc-500">{club.managerEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={club.status} />
                  </td>
                  <td className="px-4 py-3">
                    <StripeBadge status={club.stripeStatus} />
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {club.bookingsCount}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {formatCurrency(club.revenuePence)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingClub(club);
                          setModalOpen(true);
                        }}
                        className="text-xs font-semibold text-violet-700 hover:text-violet-900"
                      >
                        Edit
                      </button>
                      <Link
                        href="/club/dashboard"
                        className="text-xs font-semibold text-violet-700 hover:text-violet-900"
                      >
                        View club
                      </Link>
                      {club.status !== "suspended" ? (
                        <button
                          type="button"
                          onClick={() => {
                            suspendFranchiseeClub(club.id);
                            refresh();
                          }}
                          className="text-xs font-semibold text-amber-700 hover:text-amber-900"
                        >
                          Suspend
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              `Remove ${club.name} from the organisation?`,
                            )
                          ) {
                            removeFranchiseeClub(club.id);
                            refresh();
                          }
                        }}
                        className="text-xs font-semibold text-red-700 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {policy ? (
        <PermissionToggles policy={policy} onChange={handlePolicyChange} />
      ) : null}

      <ClubFormModal
        open={modalOpen}
        initial={editingClub}
        onClose={() => {
          setModalOpen(false);
          setEditingClub(undefined);
        }}
        onSave={handleSave}
      />
    </div>
  );
}
