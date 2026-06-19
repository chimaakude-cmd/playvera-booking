"use client";

import { useMemo, useState } from "react";
import { getSessions, type ClubSession } from "@/lib/sessions";
import { sessionToWizardFormData, type WizardFormData } from "@/lib/session-wizard";

type CopyFromExistingStepProps = {
  onStartFresh: () => void;
  onCopyFrom: (data: WizardFormData) => void;
};

export function CopyFromExistingStep({
  onStartFresh,
  onCopyFrom,
}: CopyFromExistingStepProps) {
  const sessions = useMemo(
    () =>
      getSessions().filter(
        (session) => session.published !== false && session.sessionTitle.trim(),
      ),
    [],
  );
  const [selectedId, setSelectedId] = useState<string>("");
  const [mode, setMode] = useState<"choose" | "copy">("choose");

  function handleCopyConfirm() {
    const source = sessions.find((session) => session.id === selectedId);
    if (!source) {
      return;
    }

    onCopyFrom(sessionToWizardFormData(source));
  }

  if (mode === "choose") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">
            How would you like to start?
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Create a brand-new activity or copy details from one you already
            run.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={onStartFresh}
            className="rounded-2xl border border-[#F87128] bg-orange-50 p-5 text-left ring-1 ring-[#F87128] transition-colors hover:bg-orange-100/70"
          >
            <p className="font-semibold text-zinc-900">Start from scratch</p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Set up a new activity with a blank form.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setMode("copy")}
            disabled={sessions.length === 0}
            className="rounded-2xl border border-zinc-200 bg-white p-5 text-left transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <p className="font-semibold text-zinc-900">
              Copy details from an existing activity
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Prefill the wizard from a session you have already created.
            </p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">
          Copy from an existing activity
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          We will copy structure, schedule, tickets, and questions. You can edit
          everything before publishing.
        </p>
      </div>

      {sessions.length === 0 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You do not have any activities to copy yet. Start from scratch instead.
        </p>
      ) : (
        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-700">
            Choose an activity
          </span>
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900"
          >
            <option value="">Select an activity…</option>
            {sessions.map((session: ClubSession) => (
              <option key={session.id} value={session.id}>
                {session.sessionTitle}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={() => setMode("choose")}
          className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleCopyConfirm}
          disabled={!selectedId}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "#F87128" }}
        >
          Continue with copied details
        </button>
      </div>
    </div>
  );
}
