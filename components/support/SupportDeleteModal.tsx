"use client";

import { useModalDismiss } from "@/lib/hooks/use-modal-dismiss";
type SupportDeleteModalProps = {
  open: boolean;
  count?: number;
  onCancel: () => void;
  onConfirm: () => void;
};

export function SupportDeleteModal({
  open,
  count = 1,
  onCancel,
  onConfirm,
}: SupportDeleteModalProps) {
  useModalDismiss(open, onCancel);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-zinc-900/40"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-base font-semibold text-zinc-900">
          Delete conversation{count > 1 ? "s" : ""}?
        </h3>
        <p className="mt-2 text-sm text-zinc-600">
          {count > 1
            ? `${count} conversations will move to Recently deleted. You can recover them within 30 days.`
            : "This conversation will move to Recently deleted. You can recover it within 30 days."}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Delete permanently after confirmation in Recently deleted.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
