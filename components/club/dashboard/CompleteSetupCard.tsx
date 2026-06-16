"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  dismissSetupCard,
  getSetupProgress,
  isSetupCardDismissed,
  type SetupTask,
} from "@/lib/club-setup";

export function CompleteSetupCard() {
  const [progress, setProgress] = useState(() => getSetupProgress());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(isSetupCardDismissed());
    setProgress(getSetupProgress());
  }, []);

  if (dismissed || progress.percent >= 100) {
    return null;
  }

  function handleDismiss() {
    dismissSetupCard();
    setDismissed(true);
  }

  return (
    <section className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-teal-100 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Complete setup</h2>
          <p className="mt-1 text-sm text-zinc-600">
            {progress.percent}% complete — finish these tasks when you are ready.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-700"
        >
          Dismiss
        </button>
      </div>

      <div className="px-5 pt-4">
        <div className="h-2 overflow-hidden rounded-full bg-teal-100">
          <div
            className="h-full rounded-full bg-teal-600 transition-all duration-500"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      <ul className="divide-y divide-teal-100/80 px-5 py-2">
        {progress.tasks.map((task) => (
          <SetupTaskRow key={task.id} task={task} />
        ))}
      </ul>
    </section>
  );
}

function SetupTaskRow({ task }: { task: SetupTask }) {
  return (
    <li className="flex items-start gap-3 py-3">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
          task.completed
            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
            : "border-zinc-300 bg-white text-transparent"
        }`}
        aria-hidden
      >
        ✓
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={task.href}
            className="text-sm font-medium text-zinc-900 hover:text-teal-700"
          >
            {task.label}
          </Link>
          {task.required ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
              Required for payments
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">{task.description}</p>
      </div>
    </li>
  );
}
