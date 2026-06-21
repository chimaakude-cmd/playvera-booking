"use client";

import Link from "next/link";
import { useState } from "react";
import type { AdminLifecycleProvider } from "@/lib/admin/types";
import {
  PROVIDER_HIDDEN_REASON_LABELS,
  PROVIDER_LIFECYCLE_STATUS_LABELS,
} from "@/lib/admin/provider-status";

function LifecycleActionButtons({
  provider,
  onActionComplete,
}: {
  provider: AdminLifecycleProvider;
  onActionComplete: () => void;
}) {
  const [busyAction, setBusyAction] = useState<
    "repair" | "repair_profile" | "repair_activities" | "abandon" | "delete" | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function runLifecycleAction(
    action: "repair" | "repair_profile" | "repair_activities" | "abandon" | "delete",
  ) {
    if (
      action === "delete" &&
      !window.confirm(
        "Permanently delete this provider? Login, listings, and activities will be disabled. Finance records are retained.",
      )
    ) {
      return;
    }

    setBusyAction(action);
    setActionError(null);

    try {
      const response = await fetch(
        `/api/admin/providers/${provider.id}/lifecycle`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );
      const payload = (await response.json()) as {
        error?: string;
        financeWarning?: string | null;
      };

      if (!response.ok) {
        setActionError(payload.error || "Action failed.");
        return;
      }

      if (payload.financeWarning) {
        window.alert(payload.financeWarning);
      }

      onActionComplete();
    } catch {
      setActionError("Action request failed.");
    } finally {
      setBusyAction(null);
    }
  }

  if (provider.lifecycleStatus === "deleted") {
    return <span className="text-xs text-zinc-400">Deleted</span>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busyAction !== null}
          onClick={() => void runLifecycleAction("repair")}
          className="rounded-lg bg-violet-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-800 disabled:opacity-60"
        >
          {busyAction === "repair" ? "Repairing…" : "Repair"}
        </button>
        <button
          type="button"
          disabled={busyAction !== null}
          onClick={() => void runLifecycleAction("repair_profile")}
          className="rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-medium text-violet-800 hover:bg-violet-50 disabled:opacity-60"
        >
          {busyAction === "repair_profile" ? "Repairing…" : "Repair profile"}
        </button>
        <button
          type="button"
          disabled={busyAction !== null}
          onClick={() => void runLifecycleAction("repair_activities")}
          className="rounded-lg border border-sky-200 px-3 py-1.5 text-xs font-medium text-sky-800 hover:bg-sky-50 disabled:opacity-60"
        >
          {busyAction === "repair_activities" ? "Repairing…" : "Repair activities"}
        </button>
        <button
          type="button"
          disabled={busyAction !== null}
          onClick={() => void runLifecycleAction("abandon")}
          className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-50 disabled:opacity-60"
        >
          {busyAction === "abandon" ? "Updating…" : "Mark abandoned"}
        </button>
        <button
          type="button"
          disabled={busyAction !== null}
          onClick={() => void runLifecycleAction("delete")}
          className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60"
        >
          {busyAction === "delete" ? "Deleting…" : "Delete"}
        </button>
      </div>
      {actionError ? (
        <p className="text-xs text-rose-700">{actionError}</p>
      ) : null}
    </div>
  );
}

export function AdminProviderLifecycleTable({
  providers,
  onActionComplete,
}: {
  providers: AdminLifecycleProvider[];
  onActionComplete: () => void;
}) {
  if (providers.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200/80 bg-white px-4 py-12 text-center shadow-sm">
        <p className="text-sm text-zinc-500">No providers in this tab.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-100">
          <thead>
            <tr className="bg-zinc-50/80">
              {[
                "Provider ID",
                "Owner email",
                "Club name",
                "Onboarding",
                "Created",
                "Reason hidden",
                "Activities",
                "Bookings",
                "Payment status",
                "Actions",
              ].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {providers.map((provider) => (
              <tr key={provider.id} className="hover:bg-zinc-50/50">
                <td className="whitespace-nowrap px-4 py-4 font-mono text-xs text-zinc-600">
                  <Link
                    href={`/admin/providers/${provider.id}`}
                    className="text-violet-700 hover:text-violet-900"
                  >
                    {provider.id.slice(0, 8)}…
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-zinc-700">
                  {provider.ownerEmail}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-zinc-900">
                  {provider.clubName}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-zinc-700">
                  {provider.onboardingComplete ? "Complete" : "Incomplete"}
                  <span className="mt-0.5 block text-xs text-zinc-500">
                    {PROVIDER_LIFECYCLE_STATUS_LABELS[provider.lifecycleStatus]}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-zinc-600">
                  {provider.createdAt}
                </td>
                <td className="px-4 py-4">
                  <div className="flex max-w-xs flex-wrap gap-1">
                    {provider.hiddenReasons.map((reason) => (
                      <span
                        key={reason}
                        className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-900"
                      >
                        {PROVIDER_HIDDEN_REASON_LABELS[reason]}
                      </span>
                    ))}
                  </div>
                  {provider.queryError ? (
                    <p className="mt-1 text-xs text-rose-700">{provider.queryError}</p>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-zinc-700">
                  {provider.activitiesCount}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-zinc-700">
                  {provider.bookingsCount}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-zinc-700">
                  {provider.paymentStatus}
                </td>
                <td className="px-4 py-4">
                  <LifecycleActionButtons
                    provider={provider}
                    onActionComplete={onActionComplete}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
