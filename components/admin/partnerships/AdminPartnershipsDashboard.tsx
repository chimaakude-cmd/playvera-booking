"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/club/PageHeader";
import { getAdminSession } from "@/lib/admin";
import {
  addPartnershipNote,
  assignPartnershipEnquiry,
  exportPartnershipEnquiriesJson,
  getPartnershipEnquiries,
  getPartnershipNotes,
  PARTNERSHIP_CATEGORY_LABELS,
  PARTNERSHIP_STATUS_LABELS,
  schedulePartnershipFollowUp,
  updatePartnershipEnquiryStatus,
  type PartnershipEnquiry,
  type PartnershipEnquiryStatus,
  type PartnershipNote,
} from "@/lib/partnerships";

const ADMIN_ASSIGNEES = [
  { id: "admin_super", name: "Super Admin" },
  { id: "admin_finance", name: "Finance Admin" },
  { id: "admin_support", name: "Support Admin" },
];

const STATUS_OPTIONS: PartnershipEnquiryStatus[] = [
  "new",
  "discovery",
  "meeting_booked",
  "negotiation",
  "live",
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

function formatDate(iso: string): string {
  if (!iso) {
    return "—";
  }
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: PartnershipEnquiryStatus }) {
  const styles: Record<PartnershipEnquiryStatus, string> = {
    new: "bg-violet-50 text-violet-800",
    discovery: "bg-sky-50 text-sky-800",
    meeting_booked: "bg-teal-50 text-teal-800",
    negotiation: "bg-amber-50 text-amber-800",
    live: "bg-emerald-50 text-emerald-700",
    closed: "bg-zinc-100 text-zinc-600",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {PARTNERSHIP_STATUS_LABELS[status]}
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

export function AdminPartnershipsDashboard() {
  const [enquiries, setEnquiries] = useState<PartnershipEnquiry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    PartnershipEnquiryStatus | "all"
  >("all");
  const [internalNote, setInternalNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setEnquiries(getPartnershipEnquiries());
  }, [refreshKey]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") {
      return enquiries;
    }
    return enquiries.filter((enquiry) => enquiry.status === statusFilter);
  }, [enquiries, statusFilter]);

  const selected =
    enquiries.find((enquiry) => enquiry.id === selectedId) ?? null;
  const notes: PartnershipNote[] = selected
    ? getPartnershipNotes(selected.id)
    : [];

  function refresh() {
    setRefreshKey((key) => key + 1);
  }

  function handleAssign(adminId: string, adminName: string) {
    if (!selected) {
      return;
    }
    assignPartnershipEnquiry(selected.id, adminId, adminName);
    refresh();
  }

  function handleStatusChange(status: PartnershipEnquiryStatus) {
    if (!selected) {
      return;
    }
    updatePartnershipEnquiryStatus(selected.id, status);
    refresh();
  }

  function handleAddNote(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !internalNote.trim()) {
      return;
    }
    const session = getAdminSession();
    addPartnershipNote({
      enquiryId: selected.id,
      authorId: session?.adminId ?? "admin",
      authorName: session?.name ?? "Admin",
      body: internalNote.trim(),
    });
    setInternalNote("");
    refresh();
  }

  function handleScheduleFollowUp(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !followUpDate) {
      return;
    }
    schedulePartnershipFollowUp(selected.id, followUpDate);
    setFollowUpDate("");
    refresh();
  }

  function handleExport() {
    const json = exportPartnershipEnquiriesJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `activora-partnership-enquiries-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partnerships"
        description="Partnership enquiries from the public partnerships page."
        action={
          <button
            type="button"
            onClick={handleExport}
            className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Export list
          </button>
        }
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
            {PARTNERSHIP_STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50/80 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Organisation</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assigned</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-zinc-500"
                  >
                    No partnership enquiries yet.
                  </td>
                </tr>
              ) : (
                filtered.map((enquiry) => (
                  <tr
                    key={enquiry.id}
                    className={`transition-colors hover:bg-teal-50/30 ${
                      selectedId === enquiry.id ? "bg-teal-50/50" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">
                        {enquiry.organisationName}
                      </p>
                      {enquiry.website ? (
                        <p className="text-xs text-zinc-500">{enquiry.website}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">
                        {enquiry.firstName} {enquiry.lastName}
                      </p>
                      <p className="text-xs text-zinc-500">{enquiry.email}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {PARTNERSHIP_CATEGORY_LABELS[enquiry.partnershipCategory]}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{enquiry.country}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={enquiry.status} />
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {enquiry.assignedAdminName ?? "Unassigned"}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {formatDateTime(enquiry.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedId(enquiry.id)}
                        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-teal-700 transition hover:border-teal-300 hover:bg-teal-50"
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
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm lg:col-span-3">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600">
                  Partnership enquiry
                </p>
                <h2 className="mt-1 text-lg font-semibold text-zinc-900">
                  {selected.organisationName}
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Submitted {formatDateTime(selected.createdAt)}
                </p>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <dl className="mt-4">
              <DetailRow
                label="Contact"
                value={`${selected.firstName} ${selected.lastName}`}
              />
              <DetailRow label="Email" value={selected.email} />
              <DetailRow label="Phone" value={selected.phone} />
              <DetailRow label="Website" value={selected.website} />
              <DetailRow
                label="Category"
                value={
                  PARTNERSHIP_CATEGORY_LABELS[selected.partnershipCategory]
                }
              />
              <DetailRow label="Country" value={selected.country} />
              <DetailRow label="Proposed idea" value={selected.proposedIdea} />
              <DetailRow
                label="Expected outcomes"
                value={selected.expectedOutcomes}
              />
              <DetailRow
                label="Preferred meeting date"
                value={formatDate(selected.preferredMeetingDate)}
              />
              <DetailRow
                label="Additional information"
                value={selected.additionalInformation}
              />
              <DetailRow
                label="Follow-up scheduled"
                value={
                  selected.followUpDate
                    ? formatDate(selected.followUpDate)
                    : ""
                }
              />
            </dl>
          </div>

          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-900">Manage</h3>

              <div className="mt-4 space-y-4">
                <div>
                  <label
                    htmlFor="partnership-status"
                    className="text-xs font-medium text-zinc-600"
                  >
                    Status
                  </label>
                  <select
                    id="partnership-status"
                    value={selected.status}
                    onChange={(e) =>
                      handleStatusChange(
                        e.target.value as PartnershipEnquiryStatus,
                      )
                    }
                    className="mt-1 block w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {PARTNERSHIP_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="partnership-assignee"
                    className="text-xs font-medium text-zinc-600"
                  >
                    Assign owner
                  </label>
                  <select
                    id="partnership-assignee"
                    value={selected.assignedAdminId ?? ""}
                    onChange={(e) => {
                      const assignee = ADMIN_ASSIGNEES.find(
                        (item) => item.id === e.target.value,
                      );
                      if (assignee) {
                        handleAssign(assignee.id, assignee.name);
                      }
                    }}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                  >
                    <option value="">Unassigned</option>
                    {ADMIN_ASSIGNEES.map((assignee) => (
                      <option key={assignee.id} value={assignee.id}>
                        {assignee.name}
                      </option>
                    ))}
                  </select>
                </div>

                <form onSubmit={handleScheduleFollowUp} className="space-y-2">
                  <label
                    htmlFor="partnership-follow-up"
                    className="text-xs font-medium text-zinc-600"
                  >
                    Schedule follow-up
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="partnership-follow-up"
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="flex-1 rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={!followUpDate}
                      className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Calendar integration coming soon — date is stored locally.
                  </p>
                </form>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-900">Notes</h3>

              {notes.length > 0 ? (
                <ul className="mt-3 max-h-48 space-y-3 overflow-y-auto">
                  {notes.map((note) => (
                    <li
                      key={note.id}
                      className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2"
                    >
                      <p className="text-xs font-medium text-zinc-700">
                        {note.authorName}
                      </p>
                      <p className="mt-1 text-sm text-zinc-600">{note.body}</p>
                      <p className="mt-1 text-[10px] text-zinc-400">
                        {formatDateTime(note.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-zinc-500">No notes yet.</p>
              )}

              <form onSubmit={handleAddNote} className="mt-4 space-y-2">
                <textarea
                  rows={3}
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Add an internal note…"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={!internalNote.trim()}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
                >
                  Add note
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
