"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/club/PageHeader";
import { getAdminSession } from "@/lib/admin";
import {
  addCallbackRequestNote,
  archiveCallbackRequest,
  assignCallbackRequest,
  CALLBACK_REASON_LABELS,
  CALLBACK_STATUS_LABELS,
  getCallbackRequestNotes,
  getCallbackRequests,
  updateCallbackRequestStatus,
  type CallbackRequest,
  type CallbackRequestNote,
  type CallbackRequestStatus,
} from "@/lib/callback-requests";

const ADMIN_ASSIGNEES = [
  { id: "admin_super", name: "Super Admin" },
  { id: "admin_finance", name: "Finance Admin" },
  { id: "admin_support", name: "Support Admin" },
];

const STATUS_OPTIONS: CallbackRequestStatus[] = [
  "new",
  "scheduled",
  "completed",
  "closed",
];

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value: string): string {
  if (!value) {
    return "—";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string): string {
  if (!value) {
    return "—";
  }
  return value;
}

function StatusBadge({ status }: { status: CallbackRequestStatus }) {
  const styles: Record<CallbackRequestStatus, string> = {
    new: "bg-violet-50 text-violet-800",
    scheduled: "bg-teal-50 text-teal-800",
    completed: "bg-emerald-50 text-emerald-700",
    closed: "bg-zinc-100 text-zinc-600",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {CALLBACK_STATUS_LABELS[status]}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) {
    return null;
  }
  return (
    <div className="border-b border-zinc-50 py-2.5 last:border-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-zinc-800">{value}</dd>
    </div>
  );
}

export function AdminCallbackInbox() {
  const [requests, setRequests] = useState<CallbackRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    CallbackRequestStatus | "all"
  >("all");
  const [internalNote, setInternalNote] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setRequests(getCallbackRequests());
  }, [refreshKey]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") {
      return requests;
    }
    return requests.filter((request) => request.status === statusFilter);
  }, [requests, statusFilter]);

  const selected =
    requests.find((request) => request.id === selectedId) ?? null;
  const notes: CallbackRequestNote[] = selected
    ? getCallbackRequestNotes(selected.id)
    : [];

  function refresh() {
    setRefreshKey((key) => key + 1);
  }

  function handleAssign(adminId: string, adminName: string) {
    if (!selected) {
      return;
    }
    assignCallbackRequest(selected.id, adminId, adminName);
    refresh();
  }

  function handleStatusChange(status: CallbackRequestStatus) {
    if (!selected) {
      return;
    }
    updateCallbackRequestStatus(selected.id, status);
    refresh();
  }

  function handleAddNote(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !internalNote.trim()) {
      return;
    }
    const session = getAdminSession();
    addCallbackRequestNote({
      requestId: selected.id,
      authorId: session?.adminId ?? "admin",
      authorName: session?.name ?? "Admin",
      body: internalNote.trim(),
    });
    setInternalNote("");
    refresh();
  }

  function handleCallCompleted() {
    handleStatusChange("completed");
  }

  function handleEmailUser() {
    if (!selected) {
      return;
    }
    const subject = encodeURIComponent(
      `Re: Your callback request — Activora`,
    );
    const body = encodeURIComponent(
      `Hi ${selected.fullName},\n\nThank you for your callback request regarding ${CALLBACK_REASON_LABELS[selected.reason]}.\n\n`,
    );
    window.location.href = `mailto:${selected.email}?subject=${subject}&body=${body}`;
  }

  function handleArchive() {
    if (!selected) {
      return;
    }
    archiveCallbackRequest(selected.id);
    setSelectedId(null);
    refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Callback requests"
        description="Inbound callback requests from the public contact page."
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
            statusFilter === "all"
              ? "bg-teal-600 text-white"
              : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          All
        </button>
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
              statusFilter === status
                ? "bg-teal-600 text-white"
                : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            {CALLBACK_STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50/80 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Requested date</th>
                <th className="px-4 py-3">Requested time</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assigned to</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-sm text-zinc-500"
                  >
                    No callback requests yet.
                  </td>
                </tr>
              ) : (
                filtered.map((request) => (
                  <tr
                    key={request.id}
                    className={`transition-colors hover:bg-zinc-50/80 ${
                      selectedId === request.id ? "bg-teal-50/40" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {request.fullName}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{request.phone}</td>
                    <td className="px-4 py-3 text-zinc-700">
                      {CALLBACK_REASON_LABELS[request.reason]}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {formatDate(request.preferredDate)}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {formatTime(request.preferredTime)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {request.assignedAdminName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {formatDateTime(request.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedId(request.id)}
                        className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected ? (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm lg:col-span-2">
            <h3 className="text-sm font-semibold text-zinc-900">
              {selected.fullName}
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Submitted {formatDateTime(selected.createdAt)}
            </p>
            <dl className="mt-4">
              <DetailRow label="Email" value={selected.email} />
              <DetailRow label="Phone" value={selected.phone} />
              <DetailRow label="Organisation" value={selected.organisation} />
              <DetailRow
                label="Reason"
                value={CALLBACK_REASON_LABELS[selected.reason]}
              />
              <DetailRow
                label="Preferred date"
                value={formatDate(selected.preferredDate)}
              />
              <DetailRow
                label="Preferred time"
                value={formatTime(selected.preferredTime)}
              />
              <DetailRow label="Notes" value={selected.additionalNotes} />
            </dl>
          </div>

          <div className="space-y-4 lg:col-span-3">
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Actions
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCallCompleted}
                  className="rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-500"
                >
                  Call completed
                </button>
                <button
                  type="button"
                  onClick={handleEmailUser}
                  className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
                >
                  Email user
                </button>
                <button
                  type="button"
                  onClick={handleArchive}
                  className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
                >
                  Archive
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusChange(status)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                      selected.status === status
                        ? "bg-zinc-900 text-white"
                        : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {CALLBACK_STATUS_LABELS[status]}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold text-zinc-500">Assign to</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ADMIN_ASSIGNEES.map((admin) => (
                    <button
                      key={admin.id}
                      type="button"
                      onClick={() => handleAssign(admin.id, admin.name)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                        selected.assignedAdminId === admin.id
                          ? "bg-teal-600 text-white"
                          : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      {admin.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Internal notes
              </p>
              {notes.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-500">No notes yet.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {notes.map((note) => (
                    <li
                      key={note.id}
                      className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2.5"
                    >
                      <p className="text-xs font-medium text-zinc-500">
                        {note.authorName} · {formatDateTime(note.createdAt)}
                      </p>
                      <p className="mt-1 text-sm text-zinc-800">{note.body}</p>
                    </li>
                  ))}
                </ul>
              )}
              <form onSubmit={handleAddNote} className="mt-4 space-y-2">
                <textarea
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  rows={3}
                  placeholder="Add a note…"
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
                <button
                  type="submit"
                  disabled={!internalNote.trim()}
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
                >
                  Add notes
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
