"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminDemoEnquiriesInbox } from "@/components/admin/support/AdminDemoEnquiriesInbox";
import { PageHeader } from "@/components/club/PageHeader";
import { getAdminSession } from "@/lib/admin";
import {
  ADMIN_ASSIGNEES,
  assignThread,
  getAssignmentForThread,
  getMessagesForThread,
  getThreads,
  sendMessage,
  updateThreadStatus,
  type SupportContext,
  type SupportThread,
  type ThreadStatus,
} from "@/lib/support";

type InboxView = "support" | "demo";
type StatusFilter = "all" | ThreadStatus | "open";
type ContextFilter = "all" | SupportContext;

const CONTEXT_LABELS: Record<SupportContext, string> = {
  public: "Public",
  parent: "Parents",
  club_onboarding: "Onboarding",
  club_signed_in: "Providers",
  admin: "Admin",
};

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "waiting", label: "Waiting" },
  { key: "assigned", label: "Assigned" },
  { key: "resolved", label: "Resolved" },
];

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: ThreadStatus }) {
  const styles: Record<ThreadStatus, string> = {
    waiting: "bg-amber-50 text-amber-800",
    assigned: "bg-teal-50 text-teal-800",
    resolved: "bg-emerald-50 text-emerald-700",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export function AdminSupportInbox() {
  const [inboxView, setInboxView] = useState<InboxView>("support");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [contextFilter, setContextFilter] = useState<ContextFilter>("all");
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setThreads(getThreads(true));
  }, [refreshKey]);

  const filtered = useMemo(() => {
    return threads.filter((t) => {
      if (contextFilter !== "all" && t.context !== contextFilter) {
        return false;
      }
      if (statusFilter === "all") {
        return true;
      }
      if (statusFilter === "open") {
        return t.status === "waiting" || t.status === "assigned";
      }
      return t.status === statusFilter;
    });
  }, [threads, statusFilter, contextFilter]);

  const selected = threads.find((t) => t.id === selectedId) ?? null;
  const messages = selected ? getMessagesForThread(selected.id) : [];
  const assignment = selected ? getAssignmentForThread(selected.id) : undefined;

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  function handleReply(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !reply.trim()) {
      return;
    }
    const session = getAdminSession();
    sendMessage({
      thread_id: selected.id,
      sender_type: "human",
      sender_name: session?.name ?? "Support",
      body: reply,
    });
    setReply("");
    refresh();
  }

  function handleAssign(assigneeId: string, assigneeName: string) {
    if (!selected) {
      return;
    }
    assignThread(selected.id, assigneeId, assigneeName);
    refresh();
  }

  function handleStatusChange(status: ThreadStatus) {
    if (!selected) {
      return;
    }
    updateThreadStatus(selected.id, status);
    refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Centre"
        description="Human-only inbox — public, parent, and provider conversations."
      />

      <div className="flex flex-wrap gap-2 border-b border-zinc-100 pb-4">
        <button
          type="button"
          onClick={() => setInboxView("support")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
            inboxView === "support"
              ? "bg-teal-600 text-white"
              : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          Support threads
        </button>
        <button
          type="button"
          onClick={() => setInboxView("demo")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
            inboxView === "demo"
              ? "bg-teal-600 text-white"
              : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          Demo requests
        </button>
      </div>

      {inboxView === "demo" ? <AdminDemoEnquiriesInbox /> : null}

      {inboxView === "support" ? (
      <>
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter(key)}
            className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
              statusFilter === key
                ? "bg-teal-600 text-white"
                : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setContextFilter("all")}
          className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${
            contextFilter === "all"
              ? "bg-zinc-900 text-white"
              : "border border-zinc-200 text-zinc-600"
          }`}
        >
          All sources
        </button>
        {(
          ["public", "parent", "club_onboarding", "club_signed_in"] as const
        ).map((ctx) => (
          <button
            key={ctx}
            type="button"
            onClick={() => setContextFilter(ctx)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${
              contextFilter === ctx
                ? "bg-zinc-900 text-white"
                : "border border-zinc-200 text-zinc-600"
            }`}
          >
            {CONTEXT_LABELS[ctx]}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-zinc-100 px-4 py-3 text-xs text-zinc-500">
            {filtered.length} thread{filtered.length === 1 ? "" : "s"}
          </div>
          <ul className="max-h-[520px] divide-y divide-zinc-100 overflow-y-auto">
            {filtered.map((thread) => (
              <li key={thread.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(thread.id)}
                  className={`w-full px-4 py-3 text-left transition-colors hover:bg-zinc-50 ${
                    selectedId === thread.id ? "bg-teal-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-zinc-900">
                      {thread.icon ? `${thread.icon} ` : ""}
                      {thread.contact_name}
                    </p>
                    <StatusBadge status={thread.status} />
                  </div>
                  <p className="text-xs text-zinc-500">{thread.contact_email}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-zinc-600">
                    {thread.last_message_preview}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wide text-zinc-400">
                      {CONTEXT_LABELS[thread.context]}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {formatDateTime(thread.last_message_at)}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm lg:col-span-3">
          {!selected ? (
            <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
              Select a conversation
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="border-b border-zinc-100 px-4 py-4">
                <h2 className="text-sm font-semibold text-zinc-900">
                  {selected.subject}
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  {selected.contact_name} · {selected.contact_email} ·{" "}
                  {CONTEXT_LABELS[selected.context]}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <select
                    value={selected.status}
                    onChange={(e) =>
                      handleStatusChange(e.target.value as ThreadStatus)
                    }
                    className="rounded-lg border border-zinc-200 px-2 py-1 text-xs"
                  >
                    {(["waiting", "assigned", "resolved"] as const).map(
                      (s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ),
                    )}
                  </select>
                  {ADMIN_ASSIGNEES.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => handleAssign(a.id, a.name)}
                      className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      Assign to {a.name}
                    </button>
                  ))}
                </div>
                {assignment ? (
                  <p className="mt-2 text-xs text-teal-700">
                    Assigned: {assignment.assignee_name}
                  </p>
                ) : null}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      message.sender_type === "human"
                        ? "ml-auto bg-teal-600 text-white"
                        : message.sender_type === "ai"
                          ? "border border-teal-100 bg-teal-50 text-zinc-800"
                          : message.sender_type === "system"
                            ? "bg-zinc-100 text-zinc-600"
                            : "bg-zinc-100 text-zinc-900"
                    }`}
                  >
                    <p className="text-[10px] font-medium opacity-70">
                      {message.sender_name}
                    </p>
                    <p className="mt-0.5">{message.body}</p>
                    <p className="mt-1 text-[10px] opacity-60">
                      {formatDateTime(message.created_at)}
                    </p>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleReply}
                className="border-t border-zinc-100 px-4 py-3"
              >
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Reply as support agent…"
                  rows={2}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="mt-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700"
                >
                  Send reply
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
      </>
      ) : null}
    </div>
  );
}
