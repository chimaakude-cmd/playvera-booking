"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/club/PageHeader";
import { SessionWizard } from "@/components/club/session-wizard/SessionWizard";
import {
  PlanUpgradeModal,
  useActivityCreationGate,
} from "@/components/subscription/PlanUpgradeModal";
import { loadSessionsWithMeta } from "@/lib/data";

export default function CreateSessionPage() {
  const [activityCount, setActivityCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const gate = useActivityCreationGate(activityCount);

  useEffect(() => {
    let cancelled = false;

    void loadSessionsWithMeta()
      .then((result) => {
        if (!cancelled) {
          setActivityCount(result.data.length);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingCount(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loadingCount && !gate.allowed) {
      setShowUpgrade(true);
    }
  }, [loadingCount, gate.allowed]);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="Create Session"
        description="Follow the Activora wizard to set up booking structure, schedule, tickets, and parent confirmation."
      />

      {loadingCount ? (
        <p className="text-sm text-zinc-500">Checking plan limits…</p>
      ) : gate.allowed ? (
        <SessionWizard />
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="font-medium">Activity limit reached on your {gate.planLabel} plan.</p>
          <p className="mt-2">
            Upgrade to Pro for unlimited activities. All plans include a 2.5% platform
            booking fee.
          </p>
          <Link
            href="/club/settings/subscription"
            className="mt-4 inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
          >
            View upgrade options
          </Link>
        </div>
      )}

      <PlanUpgradeModal
        open={showUpgrade}
        reason="activity_limit"
        onClose={() => setShowUpgrade(false)}
        currentCount={activityCount}
        limit={gate.activityLimit}
      />
    </div>
  );
}
