"use client";

import Link from "next/link";
import type { WaitlistEntry } from "@/lib/waitlist/types";

type WaitlistConfirmationStepProps = {
  entry: WaitlistEntry;
  sessionTitle: string;
};

export function WaitlistConfirmationStep({
  entry,
  sessionTitle,
}: WaitlistConfirmationStepProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
        ✓
      </div>
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">
          You have joined the waiting list
        </h2>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          You will not be charged today.
          <br />
          If a place becomes available, we&apos;ll invite you to complete
          payment.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 px-4 py-4 text-left">
        <p className="text-sm font-semibold text-zinc-900">{sessionTitle}</p>
        <p className="mt-1 text-sm text-zinc-600">
          {entry.childName} · Position {entry.position} on the waitlist
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/parent/waitlist"
          className="inline-flex items-center justify-center rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          View waitlist status
        </Link>
        <Link
          href="/sessions"
          className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Browse more sessions
        </Link>
      </div>
    </div>
  );
}
