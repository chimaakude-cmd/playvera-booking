"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  buildNewClubChecklist,
  isSetupChecklistCollapsed,
  setSetupChecklistCollapsed,
  type NewClubChecklistItem,
} from "@/lib/club/new-club-mode";

export function SetupChecklist() {
  const [checklist, setChecklist] = useState<NewClubChecklistItem[]>(() =>
    buildNewClubChecklist(),
  );
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setChecklist(buildNewClubChecklist());
    setCollapsed(isSetupChecklistCollapsed());
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    setSetupChecklistCollapsed(next);
  }

  const incompleteCount = checklist.filter((item) => !item.completed).length;

  if (collapsed) {
    return (
      <section className="rounded-2xl border border-zinc-200/80 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              Setup checklist
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {incompleteCount} task{incompleteCount === 1 ? "" : "s"} remaining
            </p>
          </div>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="text-sm font-semibold text-violet-700 hover:text-violet-900"
          >
            Show setup checklist
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">
            Setup checklist
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Complete these steps when you&apos;re ready — paid sessions need
            Stripe, but free sessions don&apos;t.
          </p>
        </div>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="text-sm font-semibold text-zinc-500 hover:text-zinc-700"
        >
          Hide setup checklist
        </button>
      </div>

      <ul className="divide-y divide-zinc-100">
        {checklist.map((item) => (
          <ChecklistRow key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}

function ChecklistRow({ item }: { item: NewClubChecklistItem }) {
  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            item.completed
              ? "bg-emerald-100 text-emerald-700"
              : "bg-zinc-100 text-zinc-400"
          }`}
          aria-hidden
        >
          {item.completed ? "✓" : ""}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
            {item.optional ? (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Optional
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-zinc-500">{item.description}</p>
        </div>
      </div>
      <Link
        href={item.href}
        className={`inline-flex shrink-0 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
          item.completed
            ? "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            : "bg-violet-700 text-white hover:bg-violet-800"
        }`}
      >
        {item.actionLabel}
      </Link>
    </li>
  );
}
