"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/club/PageHeader";
import { getAdminSession } from "@/lib/admin";
import {
  addBugReportNote,
  assignBugReport,
  BUG_REPORT_ACCOUNT_TYPE_LABELS,
  BUG_REPORT_PRIORITY_LABELS,
  BUG_REPORT_STATUS_LABELS,
  getBugReportNotes,
  getBugReports,
  updateBugReportStatus,
  type BugReport,
  type BugReportNote,
  type BugReportPriority,
  type BugReportStatus,
} from "@/lib/bug-reports";

const ADMIN_ASSIGNEES = [
  { id: "admin_super", name: "Super Admin" },
  { id: "admin_finance", name: "Finance Admin" },
  { id: "admin_support", name: "Support Admin" },
];

const STATUS_OPTIONS: BugReportStatus[] = [
  "new",
  "investigating",
  "in_progress",
  "fixed",
  "cannot_reproduce",
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

function PriorityBadge({ priority }: { priority: BugReportPriority }) {
  const styles: Record<BugReportPriority, string> = {
    low: "bg-zinc-100 text-zinc-600",
    normal: "bg-sky-50 text-sky-700",
    high: "bg-amber-50 text-amber-800",
    urgent: "bg-rose-50 text-rose-700",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${styles[priority]}`}
    >
      {BUG_REPORT_PRIORITY_LABELS[priority]}
    </span>
  );
}

function StatusBadge({ status }: { status: BugReportStatus }) {
  const styles: Record<BugReportStatus, string> = {
    new: "bg-violet-50 text-violet-800",
    investigating: "bg-amber-50 text-amber-800",
    in_progress: "bg-teal-50 text-teal-800",
    fixed: "bg-emerald-50 text-emerald-700",
    cannot_reproduce: "bg-zinc-100 text-zinc-600",
    closed: "bg-zinc-200 text-zinc-600",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {BUG_REPORT_STATUS_LABELS[status]}
    </span>
  );
}

function truncateUrl(url: string, max = 40): string {
  if (url.length <= max) {
    return url;
  }
  return `${url.slice(0, max)}…`;
}

export function AdminBugsInbox() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BugReportStatus | "all">(
    "all",
  );
  const [internalNote, setInternalNote] = useState("");
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setReports(getBugReports());
  }, [refreshKey]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") {
      return reports;
    }
    return reports.filter((report) => report.status === statusFilter);
  }, [reports, statusFilter]);

  const selected = reports.find((report) => report.id === selectedId) ?? null;
  const notes: BugReportNote[] = selected
    ? getBugReportNotes(selected.id)
    : [];

  function refresh() {
    setRefreshKey((key) => key + 1);
  }

  function handleAssign(adminId: string, adminName: string) {
    if (!selected) {
      return;
    }
    assignBugReport(selected.id, adminId, adminName);
    refresh();
  }

  function handleStatusChange(status: BugReportStatus) {
    if (!selected) {
      return;
    }
    const session = getAdminSession();
    updateBugReportStatus(
      selected.id,
      status,
      session?.adminId ?? "admin",
      session?.name ?? "Admin",
    );
    refresh();
  }

  function handleAddNote(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !internalNote.trim()) {
      return;
    }
    const session = getAdminSession();
    addBugReportNote({
      bugReportId: selected.id,
      authorId: session?.adminId ?? "admin",
      authorName: session?.name ?? "Admin",
      body: internalNote.trim(),
      noteType: "internal",
    });
    setInternalNote("");
    refresh();
  }

  function handleMarkFixed() {
    handleStatusChange("fixed");
  }

  function handleContactReporter() {
    if (!selected) {
      return;
    }
    const subject = encodeURIComponent(
      `Re: Bug report ${selected.id} — Activora`,
    );
    const body = encodeURIComponent(
      `Hi ${selected.reporterName},\n\nThank you for reporting a bug on Activora. We are following up on your report regarding:\n\n"${selected.description}"\n\n`,
    );
    window.location.href = `mailto:${selected.reporterEmail}?subject=${subject}&body=${body}`;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bug reports"
        description="User-submitted issues from the public bug report form."
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
            statusFilter === "all"
              ? "bg-violet-600 text-white"
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
                ? "bg-violet-600 text-white"
                : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            {BUG_REPORT_STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50/80 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Reporter</th>
                <th className="px-4 py-3">Account type</th>
                <th className="px-4 py-3">Page URL</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Assigned</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-zinc-500"
                  >
                    {reports.length === 0
                      ? "No bug reports submitted yet."
                      : "No bug reports match this filter."}
                  </td>
                </tr>
              ) : (
                filtered.map((report) => (
                  <tr
                    key={report.id}
                    className={`transition-colors hover:bg-violet-50/30 ${
                      selectedId === report.id ? "bg-violet-50/50" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-zinc-600">
                      {report.id}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">
                        {report.reporterName}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {report.reporterEmail}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {BUG_REPORT_ACCOUNT_TYPE_LABELS[report.accountType]}
                    </td>
                    <td className="max-w-[10rem] truncate px-4 py-3 text-xs text-violet-700">
                      {truncateUrl(report.pageUrl)}
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={report.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {formatDateTime(report.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-600">
                      {report.assignedAdminName ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(report.id);
                          setShowScreenshot(false);
                        }}
                        className="rounded-lg bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-violet-500"
                      >
                        View
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
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/30"
          role="presentation"
          onClick={() => setSelectedId(null)}
        >
          <aside
            className="flex h-full w-full max-w-lg flex-col overflow-hidden bg-white shadow-2xl"
            role="dialog"
            aria-label="Bug report details"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  Bug report
                </h2>
                <p className="font-mono text-xs text-zinc-500">{selected.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
                aria-label="Close"
              >
                ✕
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={selected.status} />
                <PriorityBadge priority={selected.priority} />
              </div>

              <section className="mt-5 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Reporter
                </h3>
                <p className="text-sm text-zinc-800">
                  {selected.reporterName} · {selected.reporterEmail}
                </p>
                <p className="text-xs text-zinc-500">
                  {BUG_REPORT_ACCOUNT_TYPE_LABELS[selected.accountType]} ·{" "}
                  {formatDateTime(selected.createdAt)}
                </p>
              </section>

              <section className="mt-5 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Page URL
                </h3>
                <a
                  href={selected.pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-sm text-violet-700 hover:underline"
                >
                  {selected.pageUrl}
                </a>
              </section>

              <section className="mt-5 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  What went wrong
                </h3>
                <p className="whitespace-pre-wrap text-sm text-zinc-700">
                  {selected.description}
                </p>
              </section>

              {selected.stepsToReproduce ? (
                <section className="mt-5 space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Steps to reproduce
                  </h3>
                  <p className="whitespace-pre-wrap text-sm text-zinc-700">
                    {selected.stepsToReproduce}
                  </p>
                </section>
              ) : null}

              <section className="mt-5 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Device info
                </h3>
                <p className="text-sm text-zinc-600">
                  {selected.deviceInfo.browser} · {selected.deviceInfo.device} ·{" "}
                  {selected.deviceInfo.screenSize}
                </p>
              </section>

              {selected.screenshotUrl ? (
                <section className="mt-5">
                  <button
                    type="button"
                    onClick={() => setShowScreenshot((open) => !open)}
                    className="text-sm font-semibold text-violet-700 hover:text-violet-900"
                  >
                    {showScreenshot ? "Hide screenshot" : "View screenshot"}
                  </button>
                  {showScreenshot ? (
                    <img
                      src={selected.screenshotUrl}
                      alt="Bug report screenshot"
                      className="mt-3 max-h-64 rounded-xl border border-zinc-200 object-contain"
                    />
                  ) : null}
                </section>
              ) : null}

              <section className="mt-6 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Status timeline
                </h3>
                {notes.length === 0 ? (
                  <p className="text-sm text-zinc-500">No notes yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {notes.map((note) => (
                      <li
                        key={note.id}
                        className="rounded-xl border border-zinc-100 bg-zinc-50/50 px-3 py-2"
                      >
                        <p className="text-xs text-zinc-500">
                          {note.authorName} · {formatDateTime(note.createdAt)}
                          {note.noteType === "status_change" ? " · Status" : ""}
                        </p>
                        <p className="mt-1 text-sm text-zinc-700">{note.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <form onSubmit={handleAddNote} className="mt-5">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Internal note
                  </span>
                  <textarea
                    value={internalNote}
                    onChange={(event) => setInternalNote(event.target.value)}
                    rows={3}
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-500/20"
                    placeholder="Add an internal note…"
                  />
                </label>
                <button
                  type="submit"
                  disabled={!internalNote.trim()}
                  className="mt-2 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  Add note
                </button>
              </form>
            </div>

            <footer className="space-y-3 border-t border-zinc-100 px-5 py-4">
              <div className="flex flex-wrap gap-2">
                <select
                  value={selected.status}
                  onChange={(event) =>
                    handleStatusChange(event.target.value as BugReportStatus)
                  }
                  className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium outline-none focus:border-violet-300"
                  aria-label="Change status"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {BUG_REPORT_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>

                <select
                  value={selected.assignedAdminId ?? ""}
                  onChange={(event) => {
                    const assignee = ADMIN_ASSIGNEES.find(
                      (item) => item.id === event.target.value,
                    );
                    if (assignee) {
                      handleAssign(assignee.id, assignee.name);
                    }
                  }}
                  className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium outline-none focus:border-violet-300"
                  aria-label="Assign admin"
                >
                  <option value="">Assign to…</option>
                  {ADMIN_ASSIGNEES.map((assignee) => (
                    <option key={assignee.id} value={assignee.id}>
                      {assignee.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleMarkFixed}
                  className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  Mark fixed
                </button>
                <button
                  type="button"
                  onClick={handleContactReporter}
                  className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Contact reporter
                </button>
              </div>
            </footer>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
