"use client";

import { useModalDismiss } from "@/lib/hooks/use-modal-dismiss";
import type { RegisterChildEntry } from "@/lib/club-registers";

type MedicalDetailModalProps = {
  entry: RegisterChildEntry | null;
  onClose: () => void;
};

export function MedicalDetailModal({ entry, onClose }: MedicalDetailModalProps) {
  useModalDismiss(Boolean(entry), onClose);

  if (!entry) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close medical details"
        className="absolute inset-0 bg-zinc-900/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="medical-detail-title"
        className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="medical-detail-title"
              className="text-lg font-semibold text-zinc-900"
            >
              Medical & emergency — {entry.childName}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Safeguarding information from verified booking
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg px-2 py-1 text-xl text-zinc-400 hover:text-zinc-700"
          >
            ×
          </button>
        </div>

        <dl className="mt-5 space-y-4 text-sm">
          <div>
            <dt className="font-medium text-zinc-500">Medical conditions</dt>
            <dd className="mt-1 text-zinc-900">
              {entry.medicalConditions.trim() || "None reported"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500">Allergies</dt>
            <dd className="mt-1 text-zinc-900">
              {entry.allergies.trim() || "None reported"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500">Medication notes</dt>
            <dd className="mt-1 text-zinc-900">
              {entry.medicationNotes.trim() || "None reported"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500">Emergency contact</dt>
            <dd className="mt-1 text-zinc-900">
              {entry.emergencyContactName}
              <br />
              {entry.emergencyContactPhone}
            </dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Close
        </button>
      </div>
    </div>
  );
}
