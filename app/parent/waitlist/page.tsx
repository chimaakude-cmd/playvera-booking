"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/club/PageHeader";
import { LoadingState } from "@/components/club/LoadingState";
import { EmptyState } from "@/components/club/EmptyState";
import { WaitlistEntryCard } from "@/components/parent/WaitlistEntryCard";
import { readAuthSession } from "@/lib/auth/session";
import { getParentProfile } from "@/lib/parent-profile";
import { getSessionById } from "@/lib/sessions";
import { getWaitlistEntriesForParent } from "@/lib/waitlist/storage";
import type { WaitlistEntry } from "@/lib/waitlist/types";

export default function ParentWaitlistPage() {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);

  useEffect(() => {
    const auth = readAuthSession();
    const profile = getParentProfile();
    const email = profile.email || auth?.email || "";
    setEntries(getWaitlistEntriesForParent(email, auth?.id));
    setLoading(false);

    const timer = setInterval(() => {
      setEntries(getWaitlistEntriesForParent(email, auth?.id));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return <LoadingState message="Loading waitlist..." />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Waitlist"
        description="Track your position and invitation status for sold-out sessions."
      />

      {entries.length === 0 ? (
        <EmptyState
          title="No waitlist entries"
          description="When you join a waitlist for a full session, it will appear here."
          actionLabel="Browse sessions"
          actionHref="/sessions"
        />
      ) : (
        <div className="grid gap-4">
          {entries.map((entry) => {
            const session = getSessionById(entry.sessionId);
            return (
              <WaitlistEntryCard
                key={entry.id}
                entry={entry}
                sessionTitle={session?.sessionTitle ?? "Session"}
              />
            );
          })}
        </div>
      )}

      <Link
        href="/sessions"
        className="inline-flex rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
      >
        Browse sessions
      </Link>
    </div>
  );
}
