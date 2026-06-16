"use client";

import { FormEvent, useState } from "react";
import { useModalDismiss } from "@/lib/hooks/use-modal-dismiss";
import {
  CLUB_ROLE_LABELS,
  INVITABLE_ROLES,
  type ClubRole,
  type InviteStaffInput,
} from "@/lib/club-team";

const inputClassName =
  "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100";

type InviteStaffModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: InviteStaffInput) => void;
};

export function InviteStaffModal({
  open,
  onClose,
  onSubmit,
}: InviteStaffModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<ClubRole, "owner">>("coach");
  const [note, setNote] = useState("");

  useModalDismiss(open, onClose);

  if (!open) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({ firstName, lastName, email, role, note });
    setFirstName("");
    setLastName("");
    setEmail("");
    setRole("coach");
    setNote("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close invite modal"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold text-zinc-900">Invite staff member</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Send an invitation with a fixed Activora role. Email delivery is stubbed
          for now.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-800">First name</span>
            <input
              required
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className={inputClassName}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-800">Last name</span>
            <input
              required
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className={inputClassName}
            />
          </label>
        </div>

        <label className="mt-4 block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-800">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClassName}
            placeholder="coach@yourclub.com"
          />
        </label>

        <label className="mt-4 block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-800">Role</span>
          <select
            value={role}
            onChange={(event) =>
              setRole(event.target.value as Exclude<ClubRole, "owner">)
            }
            className={inputClassName}
          >
            {INVITABLE_ROLES.map((option) => (
              <option key={option} value={option}>
                {CLUB_ROLE_LABELS[option]}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-800">
            Optional note
          </span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            className={`${inputClassName} min-h-[88px] resize-y`}
            placeholder="e.g. Covers Saturday football sessions"
          />
        </label>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Send invite
          </button>
        </div>
      </form>
    </div>
  );
}
