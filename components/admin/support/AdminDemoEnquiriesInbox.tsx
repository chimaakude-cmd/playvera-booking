"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEMO_ENQUIRY_LOCATION_LABELS,
  DEMO_ENQUIRY_STATUS_LABELS,
  getDemoEnquiries,
  updateDemoEnquiryStatus,
  type DemoEnquiry,
  type DemoEnquiryStatus,
} from "@/lib/demo-enquiries";

const STATUS_OPTIONS: DemoEnquiryStatus[] = ["new", "contacted", "closed"];

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: DemoEnquiryStatus }) {
  const styles: Record<DemoEnquiryStatus, string> = {
    new: "bg-teal-50 text-teal-800",
    contacted: "bg-amber-50 text-amber-800",
    closed: "bg-zinc-100 text-zinc-600",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {DEMO_ENQUIRY_STATUS_LABELS[status]}
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

export function AdminDemoEnquiriesInbox() {
  const [enquiries, setEnquiries] = useState<DemoEnquiry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<DemoEnquiryStatus | "all">(
    "all",
  );
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setEnquiries(getDemoEnquiries());
  }, [refreshKey]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") {
      return enquiries;
    }
    return enquiries.filter((enquiry) => enquiry.status === statusFilter);
  }, [enquiries, statusFilter]);

  const selected =
    enquiries.find((enquiry) => enquiry.id === selectedId) ?? null;

  function refresh() {
    setRefreshKey((key) => key + 1);
  }

  function handleStatusChange(status: DemoEnquiryStatus) {
    if (!selected) {
      return;
    }
    updateDemoEnquiryStatus(selected.id, status);
    refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm lg:col-span-2">
        <div className="flex flex-wrap gap-2 border-b border-zinc-100 px-4 py-3">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${
              statusFilter === "all"
                ? "bg-teal-600 text-white"
                : "border border-zinc-200 text-zinc-600"
            }`}
          >
            All
          </button>
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                statusFilter === status
                  ? "bg-teal-600 text-white"
                  : "border border-zinc-200 text-zinc-600"
              }`}
            >
              {DEMO_ENQUIRY_STATUS_LABELS[status]}
            </button>
          ))}
        </div>
        <div className="border-b border-zinc-100 px-4 py-3 text-xs text-zinc-500">
          {filtered.length} demo request{filtered.length === 1 ? "" : "s"}
        </div>
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-zinc-500">
            No demo requests yet.
          </div>
        ) : (
          <ul className="max-h-[520px] divide-y divide-zinc-100 overflow-y-auto">
            {filtered.map((enquiry) => (
              <li key={enquiry.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(enquiry.id)}
                  className={`w-full px-4 py-3 text-left transition-colors hover:bg-zinc-50 ${
                    selectedId === enquiry.id ? "bg-teal-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-zinc-900">
                      {enquiry.clubName}
                    </p>
                    <StatusBadge status={enquiry.status} />
                  </div>
                  <p className="text-xs text-zinc-500">
                    {enquiry.firstName} {enquiry.lastName} · {enquiry.businessEmail}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs text-zinc-600">
                    {enquiry.activityType} ·{" "}
                    {DEMO_ENQUIRY_LOCATION_LABELS[enquiry.location]}
                  </p>
                  <p className="mt-2 text-[10px] text-zinc-400">
                    {formatDateTime(enquiry.createdAt)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm lg:col-span-3">
        {!selected ? (
          <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
            Select a demo request
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <div className="border-b border-zinc-100 px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600">
                    Demo request
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-zinc-900">
                    {selected.clubName}
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    Submitted {formatDateTime(selected.createdAt)}
                  </p>
                </div>
                <StatusBadge status={selected.status} />
              </div>
              <div className="mt-3">
                <label
                  htmlFor="demo-enquiry-status"
                  className="text-xs font-medium text-zinc-600"
                >
                  Status
                </label>
                <select
                  id="demo-enquiry-status"
                  value={selected.status}
                  onChange={(e) =>
                    handleStatusChange(e.target.value as DemoEnquiryStatus)
                  }
                  className="mt-1 block rounded-lg border border-zinc-200 px-2 py-1.5 text-xs"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {DEMO_ENQUIRY_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <dl className="flex-1 overflow-y-auto px-4 py-2">
              <DetailRow
                label="Contact"
                value={`${selected.firstName} ${selected.lastName}`}
              />
              <DetailRow label="Email" value={selected.businessEmail} />
              <DetailRow label="Phone" value={selected.businessPhone} />
              <DetailRow label="Job role" value={selected.jobRole} />
              <DetailRow label="Programme size" value={selected.programmeSize} />
              <DetailRow label="Activity type" value={selected.activityType} />
              <DetailRow label="Start timeline" value={selected.startTimeline} />
              <DetailRow
                label="Location"
                value={DEMO_ENQUIRY_LOCATION_LABELS[selected.location]}
              />
              <DetailRow
                label="Additional info"
                value={selected.additionalInfo}
              />
              <DetailRow
                label="Marketing consent"
                value={selected.consentGiven ? "Yes" : "No"}
              />
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
