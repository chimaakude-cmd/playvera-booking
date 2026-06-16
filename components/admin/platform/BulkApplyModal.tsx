"use client";

import { useEffect, useState } from "react";
import { useModalDismiss } from "@/lib/hooks/use-modal-dismiss";
import {
  DEMO_PROVIDER_COUNT,
  type BulkApplyScope,
  type MessageTemplateRecord,
} from "@/lib/message-templates";

type BulkApplyModalProps = {
  open: boolean;
  template: MessageTemplateRecord | null;
  onClose: () => void;
  onConfirm: (scope: BulkApplyScope) => void;
};

export function BulkApplyModal({
  open,
  template,
  onClose,
  onConfirm,
}: BulkApplyModalProps) {
  const [scope, setScope] = useState<BulkApplyScope>("all_providers");
  useModalDismiss(open, onClose);

  useEffect(() => {
    if (open) {
      setScope("all_providers");
    }
  }, [open]);

  if (!open || !template) {
    return null;
  }

  const providerCount =
    scope === "new_providers_only"
      ? 42
      : scope === "selected_providers"
        ? 3
        : DEMO_PROVIDER_COUNT;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-zinc-900">
          Apply template update
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Push changes to &ldquo;{template.name}&rdquo; across providers.
        </p>

        <div className="mt-5 space-y-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 px-4 py-3">
            <input
              type="radio"
              name="bulk-scope"
              checked={scope === "all_providers"}
              onChange={() => setScope("all_providers")}
              className="mt-1 h-4 w-4 border-zinc-300 text-violet-600 focus:ring-violet-500"
            />
            <span>
              <span className="block text-sm font-medium text-zinc-900">
                All providers
              </span>
              <span className="mt-0.5 block text-xs text-zinc-500">
                Overwrites platform default for every club using defaults.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 px-4 py-3">
            <input
              type="radio"
              name="bulk-scope"
              checked={scope === "new_providers_only"}
              onChange={() => setScope("new_providers_only")}
              className="mt-1 h-4 w-4 border-zinc-300 text-violet-600 focus:ring-violet-500"
            />
            <span>
              <span className="block text-sm font-medium text-zinc-900">
                Only new providers
              </span>
              <span className="mt-0.5 block text-xs text-zinc-500">
                Applies to clubs created after this update.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 px-4 py-3">
            <input
              type="radio"
              name="bulk-scope"
              checked={scope === "selected_providers"}
              onChange={() => setScope("selected_providers")}
              className="mt-1 h-4 w-4 border-zinc-300 text-violet-600 focus:ring-violet-500"
            />
            <span>
              <span className="block text-sm font-medium text-zinc-900">
                Selected providers
              </span>
              <span className="mt-0.5 block text-xs text-zinc-500">
                Demo: 3 providers selected from the providers list.
              </span>
            </span>
          </label>
        </div>

        <p className="mt-5 rounded-xl bg-violet-50 px-4 py-3 text-sm font-medium text-violet-900">
          {providerCount.toLocaleString("en-GB")} providers will receive this
          update
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(scope)}
            className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Apply update
          </button>
        </div>
      </div>
    </div>
  );
}
