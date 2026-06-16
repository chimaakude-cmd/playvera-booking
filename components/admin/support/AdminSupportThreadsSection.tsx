"use client";

import { PageHeader } from "@/components/club/PageHeader";
import {
  adminEnvMissingLabel,
  adminLiveDataLabel,
} from "@/lib/admin/data-source";
import type { AdminSupportThreadRow } from "@/lib/admin/support-data";

type Props = {
  threads: AdminSupportThreadRow[];
  dataSource: "supabase" | "env_missing";
};

const CONTEXT_LABELS: Record<string, string> = {
  public: "Public",
  parent: "Parents",
  club_onboarding: "Onboarding",
  club_signed_in: "Providers",
  admin: "Admin",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminSupportThreadsSection({ threads, dataSource }: Props) {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Support inbox"
        description="Support threads from Supabase."
        action={
          dataSource === "env_missing" ? (
            <span className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800">
              {adminEnvMissingLabel()}
            </span>
          ) : (
            <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800">
              {adminLiveDataLabel()}
            </span>
          )
        }
      />

      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-100">
            <thead>
              <tr className="bg-zinc-50/80">
                {[
                  "Subject",
                  "Contact",
                  "Context",
                  "Status",
                  "Last message",
                  "Updated",
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
              {threads.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-zinc-500"
                  >
                    No support threads yet.
                  </td>
                </tr>
              ) : (
                threads.map((thread) => (
                  <tr key={thread.id} className="hover:bg-zinc-50/50">
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-zinc-900">
                        {thread.subject}
                      </p>
                      <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
                        {thread.lastMessagePreview}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-700">
                      <p>{thread.contactName}</p>
                      <p className="text-xs text-zinc-500">{thread.contactEmail}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-700">
                      {CONTEXT_LABELS[thread.context] ?? thread.context}
                    </td>
                    <td className="px-4 py-4 text-sm capitalize text-zinc-700">
                      {thread.status}
                    </td>
                    <td className="max-w-xs px-4 py-4 text-sm text-zinc-600">
                      {thread.lastMessagePreview}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-zinc-600">
                      {formatDateTime(thread.lastMessageAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
