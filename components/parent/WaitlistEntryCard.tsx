"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  WAITLIST_STATUS_LABELS,
  type WaitlistEntry,
  type WaitlistEntryStatus,
} from "@/lib/waitlist/types";

type WaitlistEntryCardProps = {
  entry: WaitlistEntry;
  sessionTitle: string;
};

const statusStyles: Record<WaitlistEntryStatus, string> = {
  WAITLIST_PENDING: "bg-zinc-100 text-zinc-700 border-zinc-200",
  INVITED_TO_BOOK: "bg-blue-50 text-blue-800 border-blue-200",
  PAYMENT_PENDING: "bg-amber-50 text-amber-800 border-amber-200",
  BOOKED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  DECLINED: "bg-zinc-100 text-zinc-600 border-zinc-200",
  EXPIRED: "bg-red-50 text-red-700 border-red-200",
};

function formatCountdown(expiresAt: string | null): string | null {
  if (!expiresAt) {
    return null;
  }
  const remaining = new Date(expiresAt).getTime() - Date.now();
  if (remaining <= 0) {
    return "Expired";
  }
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")} remaining`;
}

export function WaitlistEntryCard({
  entry,
  sessionTitle,
}: WaitlistEntryCardProps) {
  const [countdown, setCountdown] = useState<string | null>(
    formatCountdown(entry.inviteExpiresAt),
  );

  useEffect(() => {
    if (!entry.inviteExpiresAt) {
      return;
    }
    const timer = setInterval(() => {
      setCountdown(formatCountdown(entry.inviteExpiresAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [entry.inviteExpiresAt]);

  const showInviteLink =
    entry.status === "INVITED_TO_BOOK" && entry.inviteToken;

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">{sessionTitle}</h2>
          <p className="mt-1 text-sm text-zinc-600">{entry.childName}</p>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500">Position</dt>
              <dd className="font-medium text-zinc-900">#{entry.position}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Joined</dt>
              <dd className="font-medium text-zinc-900">
                {new Date(entry.joinedAt).toLocaleDateString("en-GB")}
              </dd>
            </div>
          </dl>
        </div>
        <span
          className={`inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles[entry.status]}`}
        >
          {WAITLIST_STATUS_LABELS[entry.status]}
        </span>
      </div>

      {countdown &&
      (entry.status === "INVITED_TO_BOOK" ||
        entry.status === "PAYMENT_PENDING") ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
          Invitation expires — {countdown}
        </p>
      ) : null}

      {showInviteLink ? (
        <Link
          href={`/book/invite/${entry.inviteToken}`}
          className="mt-4 inline-flex rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          Complete payment
        </Link>
      ) : null}
    </article>
  );
}
