"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/club/PageHeader";
import { getAdminSession } from "@/lib/admin";
import {
  addInternalNote,
  assignConversation,
  getConversations,
  getInternalNotesForConversation,
  getMessagesForConversation,
  sendMessage,
  updateConversationHandledBy,
  updateConversationStatus,
  type Conversation,
  type ConversationType,
} from "@/lib/chat";

type TabFilter = "all" | ConversationType;

const TAB_ORDER: TabFilter[] = ["public", "parent", "provider", "all"];

const TAB_LABELS: Record<TabFilter, string> = {
  public: "Public enquiries",
  parent: "Parents",
  provider: "Providers",
  all: "All conversations",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: Conversation["status"] }) {
  const styles: Record<Conversation["status"], string> = {
    open: "bg-sky-50 text-sky-700",
    pending: "bg-amber-50 text-amber-800",
    resolved: "bg-emerald-50 text-emerald-700",
    closed: "bg-zinc-100 text-zinc-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Conversation["priority"] }) {
  const styles: Record<Conversation["priority"], string> = {
    low: "text-zinc-500",
    normal: "text-zinc-700",
    high: "text-amber-700",
    urgent: "text-rose-700",
  };

  return (
    <span className={`text-xs font-medium capitalize ${styles[priority]}`}>
      {priority}
    </span>
  );
}

export function AdminMessagesSection() {
  const [tab, setTab] = useState<TabFilter>("all");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setConversations(getConversations());
  }, [refreshKey]);

  const filtered = useMemo(() => {
    if (tab === "all") {
      return conversations;
    }
    return conversations.filter((c) => c.type === tab);
  }, [conversations, tab]);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;
  const messages = selected ? getMessagesForConversation(selected.id) : [];
  const internalNotes = selected
    ? getInternalNotesForConversation(selected.id)
    : [];

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
      conversationId: selected.id,
      senderType: "admin",
      senderName: session?.name ?? "Admin",
      body: reply,
    });
    setReply("");
    refresh();
  }

  function handleAddNote(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !note.trim()) {
      return;
    }
    const session = getAdminSession();
    addInternalNote(selected.id, session?.name ?? "Admin", note);
    setNote("");
    refresh();
  }

  function handleAssign() {
    if (!selected) {
      return;
    }
    const session = getAdminSession();
    if (!session) {
      return;
    }
    assignConversation(selected.id, session.adminId, session.name);
    refresh();
  }

  function handleStatusChange(status: Conversation["status"]) {
    if (!selected) {
      return;
    }
    updateConversationStatus(selected.id, status);
    refresh();
  }

  function handleHandledByChange(handledBy: Conversation["handledBy"]) {
    if (!selected) {
      return;
    }
    updateConversationHandledBy(selected.id, handledBy);
    refresh();
  }

  function handleEscalate() {
    if (!selected) {
      return;
    }
    updateConversationHandledBy(selected.id, "human");
    window.alert("Escalated to human agent (stub).");
    refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Helpdesk inbox — public enquiries, parent support, and provider support."
      />

      <div className="flex flex-wrap gap-2">
        {TAB_ORDER.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
              tab === key
                ? "bg-zinc-900 text-white"
                : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            {TAB_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-zinc-100 px-4 py-3 text-xs text-zinc-500">
            {filtered.length} conversation{filtered.length === 1 ? "" : "s"}
          </div>
          <ul className="max-h-[520px] divide-y divide-zinc-100 overflow-y-auto">
            {filtered.map((conversation) => (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(conversation.id)}
                  className={`w-full px-4 py-3 text-left transition-colors hover:bg-zinc-50 ${
                    selectedId === conversation.id ? "bg-violet-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-zinc-900">
                      {conversation.contactName}
                    </p>
                    <PriorityBadge priority={conversation.priority} />
                  </div>
                  <p className="text-xs text-zinc-500">{conversation.contactEmail}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-zinc-600">
                    {conversation.lastMessagePreview}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={conversation.status} />
                    <span className="text-[10px] uppercase tracking-wide text-zinc-400">
                      {conversation.type}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {formatDateTime(conversation.lastMessageAt)}
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
                  {selected.contactName} · {selected.contactEmail} ·{" "}
                  {selected.userType}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <select
                    value={selected.status}
                    onChange={(e) =>
                      handleStatusChange(e.target.value as Conversation["status"])
                    }
                    className="rounded-lg border border-zinc-200 px-2 py-1 text-xs"
                  >
                    {(["open", "pending", "resolved", "closed"] as const).map(
                      (s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ),
                    )}
                  </select>
                  <select
                    value={selected.handledBy}
                    onChange={(e) =>
                      handleHandledByChange(
                        e.target.value as Conversation["handledBy"],
                      )
                    }
                    className="rounded-lg border border-zinc-200 px-2 py-1 text-xs"
                  >
                    <option value="human">Human</option>
                    <option value="ai">AI</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAssign}
                    className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700"
                  >
                    Assign to me
                  </button>
                  <button
                    type="button"
                    onClick={handleEscalate}
                    className="rounded-lg border border-amber-200 px-2 py-1 text-xs font-medium text-amber-800"
                  >
                    Escalate to human
                  </button>
                </div>
                {(selected.providerName || selected.bookingReference) && (
                  <p className="mt-2 text-xs text-zinc-500">
                    {selected.providerName ? `Provider: ${selected.providerName}` : null}
                    {selected.bookingReference
                      ? ` · Booking: ${selected.bookingReference}`
                      : null}
                  </p>
                )}
                {selected.assignedAdminName ? (
                  <p className="mt-1 text-xs text-violet-700">
                    Assigned: {selected.assignedAdminName}
                  </p>
                ) : null}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      message.senderType === "admin"
                        ? "ml-auto bg-zinc-900 text-white"
                        : message.senderType === "system"
                          ? "bg-violet-50 text-violet-900"
                          : "bg-zinc-100 text-zinc-900"
                    }`}
                  >
                    <p className="text-[10px] font-medium opacity-70">
                      {message.senderName}
                    </p>
                    <p className="mt-0.5">{message.body}</p>
                    <p className="mt-1 text-[10px] opacity-60">
                      {formatDateTime(message.createdAt)}
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
                  placeholder="Reply to customer…"
                  rows={2}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="mt-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white"
                >
                  Send reply
                </button>
              </form>

              {internalNotes.length > 0 ? (
                <div className="border-t border-zinc-100 px-4 py-3">
                  <p className="text-xs font-semibold text-zinc-600">
                    Internal notes
                  </p>
                  <ul className="mt-2 space-y-2">
                    {internalNotes.map((n) => (
                      <li
                        key={n.id}
                        className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900"
                      >
                        <span className="font-medium">{n.authorName}: </span>
                        {n.body}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <form
                onSubmit={handleAddNote}
                className="border-t border-zinc-100 px-4 py-3"
              >
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add internal note (not visible to customer)…"
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs"
                />
                <button
                  type="submit"
                  className="mt-2 rounded-lg border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700"
                >
                  Add note
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
