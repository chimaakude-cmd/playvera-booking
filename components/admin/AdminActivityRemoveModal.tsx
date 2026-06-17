"use client";

import { useState } from "react";
import {
  ACTIVITY_REMOVAL_REASONS,
  type ActivityRemovalReason,
} from "@/lib/admin/activities-data";
import type { AdminActivity } from "@/lib/admin";
import { useModalDismiss } from "@/lib/hooks/use-modal-dismiss";

type Props = {
  activity: AdminActivity;
  open: boolean;
  removing: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: (input: {
    removalReason: ActivityRemovalReason;
    removalNotes: string;
  }) => void;
};

export function AdminActivityRemoveModal({
  activity,
  open,
  removing,
  error,
  onCancel,
  onConfirm,
}: Props) {
  const [removalReason, setRemovalReason] =
    useState<ActivityRemovalReason>("false_listing");
  const [removalNotes, setRemovalNotes] = useState("");

  useModalDismiss(open, onCancel);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-zinc-900/40"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl"
      >
        <h3 className="text-lg font-semibold text-zinc-900">Remove listing</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Are you sure you want to remove this activity listing? This action
          cannot be undone.
        </p>
        <p className="mt-3 text-sm font-medium text-zinc-900">{activity.title}</p>
        <p className="text-xs text-zinc-500">{activity.providerName}</p>

        <label className="mt-5 block text-sm font-medium text-zinc-700">
          Removal reason
          <select
            required
            value={removalReason}
            onChange={(event) =>
              setRemovalReason(event.target.value as ActivityRemovalReason)
            }
            className="mt-1.5 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
          >
            {ACTIVITY_REMOVAL_REASONS.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block text-sm font-medium text-zinc-700">
          Notes <span className="font-normal text-zinc-500">(optional)</span>
          <textarea
            value={removalNotes}
            onChange={(event) => setRemovalNotes(event.target.value)}
            rows={3}
            placeholder="Add context for the provider (optional)"
            className="mt-1.5 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
          />
        </label>

        {error ? (
          <p className="mt-3 text-sm text-rose-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={removing}
            className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              onConfirm({
                removalReason,
                removalNotes: removalNotes.trim(),
              })
            }
            disabled={removing}
            className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
          >
            {removing ? "Removing…" : "Remove listing"}
          </button>
        </div>
      </div>
    </div>
  );
}
