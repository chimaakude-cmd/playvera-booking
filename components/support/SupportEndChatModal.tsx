"use client";

import { useModalDismiss } from "@/lib/hooks/use-modal-dismiss";
import { END_CHAT_CONFIRM_MESSAGE } from "@/lib/support/defaults";

type SupportEndChatModalProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function SupportEndChatModal({
  open,
  onCancel,
  onConfirm,
}: SupportEndChatModalProps) {
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
        <h3 className="text-base font-semibold text-zinc-900">End chat?</h3>
        <p className="mt-2 text-sm text-zinc-600">{END_CHAT_CONFIRM_MESSAGE}</p>
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
            className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
          >
            End chat
          </button>
        </div>
      </div>
    </div>
  );
}
