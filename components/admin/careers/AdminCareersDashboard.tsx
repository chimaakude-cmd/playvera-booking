"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/club/PageHeader";
import { getAdminSession } from "@/lib/admin";
import {
  addApplicationNote,
  APPLICATION_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  createCareerJob,
  duplicateCareerJob,
  getApplicationNotes,
  getCareerJobs,
  getCareersAnalytics,
  getJobApplications,
  JOB_DEPARTMENT_LABELS,
  JOB_STATUS_LABELS,
  setCareerJobStatus,
  updateApplicationStatus,
  updateCareerJob,
  WORK_LOCATION_LABELS,
  type ApplicationNote,
  type ApplicationStatus,
  type CareerJob,
  type ContractType,
  type JobApplication,
  type JobDepartment,
  type JobStatus,
  type WorkLocationType,
} from "@/lib/careers";

type Tab = "jobs" | "applications";

const APPLICATION_STATUSES: ApplicationStatus[] = [
  "new",
  "reviewing",
  "interview",
  "offer",
  "rejected",
  "hired",
];

const DEPARTMENTS: JobDepartment[] = [
  "sales",
  "customer_success",
  "engineering",
  "operations",
  "marketing",
  "coaching",
  "support",
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

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const styles: Record<ApplicationStatus, string> = {
    new: "bg-violet-50 text-violet-800",
    reviewing: "bg-amber-50 text-amber-800",
    interview: "bg-sky-50 text-sky-800",
    offer: "bg-teal-50 text-teal-800",
    rejected: "bg-zinc-100 text-zinc-600",
    hired: "bg-emerald-50 text-emerald-700",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {APPLICATION_STATUS_LABELS[status]}
    </span>
  );
}

function JobStatusBadge({ status }: { status: JobStatus }) {
  const styles: Record<JobStatus, string> = {
    open: "bg-emerald-50 text-emerald-700",
    closed: "bg-amber-50 text-amber-800",
    archived: "bg-zinc-100 text-zinc-600",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {JOB_STATUS_LABELS[status]}
    </span>
  );
}

type JobFormState = {
  title: string;
  department: JobDepartment;
  location: string;
  salary: string;
  contractType: ContractType;
  workLocation: WorkLocationType;
  description: string;
  responsibilities: string;
  requirements: string;
  benefits: string;
  status: JobStatus;
  featuredOnHomepage: boolean;
};

const emptyJobForm = (): JobFormState => ({
  title: "",
  department: "engineering",
  location: "",
  salary: "",
  contractType: "full_time",
  workLocation: "hybrid",
  description: "",
  responsibilities: "",
  requirements: "",
  benefits: "",
  status: "open",
  featuredOnHomepage: false,
});

function jobToForm(job: CareerJob): JobFormState {
  return {
    title: job.title,
    department: job.department,
    location: job.location,
    salary: job.salary,
    contractType: job.contractType,
    workLocation: job.workLocation,
    description: job.description,
    responsibilities: job.responsibilities.join("\n"),
    requirements: job.requirements.join("\n"),
    benefits: job.benefits.join("\n"),
    status: job.status,
    featuredOnHomepage: job.featuredOnHomepage,
  };
}

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

const inputClass =
  "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-500/20";

export function AdminCareersDashboard() {
  const [tab, setTab] = useState<Tab>("jobs");
  const [jobs, setJobs] = useState<CareerJob[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [appStatusFilter, setAppStatusFilter] = useState<
    ApplicationStatus | "all"
  >("all");
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [jobForm, setJobForm] = useState<JobFormState>(emptyJobForm());
  const [internalNote, setInternalNote] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setJobs(getCareerJobs());
    setApplications(getJobApplications());
  }, [refreshKey]);

  const analytics = useMemo(() => getCareersAnalytics(), [refreshKey]);

  const filteredApps = useMemo(() => {
    if (appStatusFilter === "all") {
      return applications;
    }
    return applications.filter((app) => app.status === appStatusFilter);
  }, [applications, appStatusFilter]);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? null;
  const selectedApp =
    applications.find((a) => a.id === selectedAppId) ?? null;
  const appNotes: ApplicationNote[] = selectedApp
    ? getApplicationNotes(selectedApp.id)
    : [];

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  function openCreateJob() {
    setEditingJobId(null);
    setJobForm(emptyJobForm());
    setShowJobForm(true);
  }

  function openEditJob(job: CareerJob) {
    setEditingJobId(job.id);
    setJobForm(jobToForm(job));
    setShowJobForm(true);
  }

  function handleSaveJob(event: React.FormEvent) {
    event.preventDefault();
    const payload = {
      title: jobForm.title,
      department: jobForm.department,
      location: jobForm.location,
      salary: jobForm.salary,
      contractType: jobForm.contractType,
      workLocation: jobForm.workLocation,
      description: jobForm.description,
      responsibilities: splitLines(jobForm.responsibilities),
      requirements: splitLines(jobForm.requirements),
      benefits: splitLines(jobForm.benefits),
      status: jobForm.status,
      featuredOnHomepage: jobForm.featuredOnHomepage,
    };

    if (editingJobId) {
      updateCareerJob(editingJobId, payload);
    } else {
      createCareerJob(payload);
    }
    setShowJobForm(false);
    refresh();
  }

  function handleAddNote(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedApp || !internalNote.trim()) {
      return;
    }
    const session = getAdminSession();
    addApplicationNote({
      applicationId: selectedApp.id,
      authorId: session?.adminId ?? "admin",
      authorName: session?.name ?? "Admin",
      body: internalNote.trim(),
    });
    setInternalNote("");
    refresh();
  }

  function handleAppStatusChange(status: ApplicationStatus) {
    if (!selectedApp) {
      return;
    }
    updateApplicationStatus(selectedApp.id, status);
    refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Careers"
        description="Manage job listings, applications, and recruitment pipeline."
      />

      {/* Analytics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-violet-700">
            Applications
          </p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">
            {analytics.totalApplications}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-violet-700">
            Views
          </p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">
            {analytics.totalViews}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-violet-700">
            Conversion
          </p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">
            {analytics.conversionRate}%
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-violet-700">
            Hiring pipeline
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-600">
            <span>New: {analytics.pipeline.new}</span>
            <span>Interview: {analytics.pipeline.interview}</span>
            <span>Offer: {analytics.pipeline.offer}</span>
            <span>Hired: {analytics.pipeline.hired}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200">
        {(["jobs", "applications"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold capitalize transition ${
              tab === t
                ? "border-b-2 border-violet-600 text-violet-700"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "jobs" ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900">Job listings</h2>
              <button
                type="button"
                onClick={openCreateJob}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Create job
              </button>
            </div>
            <div className="space-y-3">
              {jobs.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => setSelectedJobId(job.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedJobId === job.id
                      ? "border-violet-300 bg-violet-50/50"
                      : "border-zinc-200 bg-white hover:border-violet-200"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-zinc-900">{job.title}</p>
                      <p className="text-xs text-zinc-500">
                        {JOB_DEPARTMENT_LABELS[job.department]} · {job.location}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <JobStatusBadge status={job.status} />
                      {job.featuredOnHomepage ? (
                        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-800">
                          Featured
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    {job.views} views · Posted{" "}
                    {formatDateTime(job.postedAt)}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            {selectedJob ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-zinc-900">{selectedJob.title}</h3>
                <dl className="mt-3 space-y-1 text-sm text-zinc-600">
                  <div>{JOB_DEPARTMENT_LABELS[selectedJob.department]}</div>
                  <div>{selectedJob.salary}</div>
                  <div>
                    {WORK_LOCATION_LABELS[selectedJob.workLocation]} ·{" "}
                    {CONTRACT_TYPE_LABELS[selectedJob.contractType]}
                  </div>
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEditJob(selectedJob)}
                    className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
                  >
                    Edit
                  </button>
                  <Link
                    href={`/careers/${selectedJob.slug}`}
                    target="_blank"
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50"
                  >
                    Preview
                  </Link>
                  {selectedJob.status === "open" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCareerJobStatus(selectedJob.id, "closed");
                        refresh();
                      }}
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                      Close
                    </button>
                  ) : selectedJob.status === "closed" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCareerJobStatus(selectedJob.id, "open");
                        refresh();
                      }}
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                    >
                      Reopen
                    </button>
                  ) : null}
                  {selectedJob.status !== "archived" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCareerJobStatus(selectedJob.id, "archived");
                        refresh();
                      }}
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                    >
                      Archive
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      duplicateCareerJob(selectedJob.id);
                      refresh();
                    }}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                  >
                    Duplicate
                  </button>
                </div>
                <label className="mt-4 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedJob.featuredOnHomepage}
                    onChange={(e) => {
                      updateCareerJob(selectedJob.id, {
                        featuredOnHomepage: e.target.checked,
                      });
                      refresh();
                    }}
                    className="h-4 w-4 rounded border-zinc-300 text-violet-600"
                  />
                  Feature on homepage
                </label>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Select a job to manage.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAppStatusFilter("all")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  appStatusFilter === "all"
                    ? "bg-violet-600 text-white"
                    : "bg-zinc-100 text-zinc-600"
                }`}
              >
                All
              </button>
              {APPLICATION_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setAppStatusFilter(status)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    appStatusFilter === status
                      ? "bg-violet-600 text-white"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {APPLICATION_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {filteredApps.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => setSelectedAppId(app.id)}
                  className={`w-full rounded-xl border p-3 text-left ${
                    selectedAppId === app.id
                      ? "border-violet-300 bg-violet-50/50"
                      : "border-zinc-200 bg-white hover:border-violet-200"
                  }`}
                >
                  <p className="font-semibold text-sm text-zinc-900">
                    {app.candidateName}
                  </p>
                  <p className="text-xs text-zinc-500">{app.jobTitle}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <StatusBadge status={app.status} />
                    <span className="text-xs text-zinc-400">
                      {formatDateTime(app.createdAt)}
                    </span>
                  </div>
                </button>
              ))}
              {filteredApps.length === 0 ? (
                <p className="text-sm text-zinc-500">No applications yet.</p>
              ) : null}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedApp ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900">
                      {selectedApp.candidateName}
                    </h3>
                    <p className="text-sm text-zinc-500">
                      Applied for {selectedApp.jobTitle}
                    </p>
                  </div>
                  <StatusBadge status={selectedApp.status} />
                </div>

                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium text-zinc-500">Email</dt>
                    <dd>
                      <a
                        href={`mailto:${selectedApp.candidateEmail}`}
                        className="text-violet-700 hover:text-violet-900"
                      >
                        {selectedApp.candidateEmail}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-zinc-500">Phone</dt>
                    <dd>{selectedApp.candidatePhone}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-zinc-500">
                      LinkedIn
                    </dt>
                    <dd>
                      {selectedApp.linkedInUrl ? (
                        <a
                          href={selectedApp.linkedInUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-violet-700 hover:text-violet-900"
                        >
                          Profile
                        </a>
                      ) : (
                        "—"
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-zinc-500">
                      Availability
                    </dt>
                    <dd>{selectedApp.availability}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-zinc-500">
                      Right to work
                    </dt>
                    <dd>{selectedApp.rightToWork ? "Yes" : "No"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-zinc-500">
                      Applied
                    </dt>
                    <dd>{formatDateTime(selectedApp.createdAt)}</dd>
                  </div>
                </dl>

                {selectedApp.coverNote ? (
                  <section className="mt-5">
                    <h4 className="text-sm font-semibold text-zinc-900">
                      Cover note
                    </h4>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600">
                      {selectedApp.coverNote}
                    </p>
                  </section>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-2">
                  {selectedApp.cvDataUrl ? (
                    <a
                      href={selectedApp.cvDataUrl}
                      download={
                        selectedApp.cvFileName ?? `${selectedApp.candidateName}-cv`
                      }
                      className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
                    >
                      Download CV
                    </a>
                  ) : selectedApp.cvFileName ? (
                    <span className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs text-zinc-600">
                      CV: {selectedApp.cvFileName} (not stored — too large)
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-500">No CV attached</span>
                  )}
                  <a
                    href={`mailto:${selectedApp.candidateEmail}?subject=Re: Your application for ${selectedApp.jobTitle}`}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50"
                  >
                    Email candidate
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      alert(
                        "Interview scheduling integration coming soon. Use Email candidate for now.",
                      )
                    }
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                  >
                    Schedule interview
                  </button>
                </div>

                <section className="mt-6">
                  <h4 className="text-sm font-semibold text-zinc-900">
                    Move stage
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {APPLICATION_STATUSES.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleAppStatusChange(status)}
                        disabled={selectedApp.status === status}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          selectedApp.status === status
                            ? "bg-violet-600 text-white"
                            : "bg-zinc-100 text-zinc-600 hover:bg-violet-50 hover:text-violet-800"
                        }`}
                      >
                        {APPLICATION_STATUS_LABELS[status]}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="mt-6">
                  <h4 className="text-sm font-semibold text-zinc-900">Notes</h4>
                  <ul className="mt-3 space-y-2">
                    {appNotes.map((note) => (
                      <li
                        key={note.id}
                        className="rounded-lg bg-zinc-50 px-3 py-2 text-sm"
                      >
                        <p className="text-zinc-700">{note.body}</p>
                        <p className="mt-1 text-xs text-zinc-400">
                          {note.authorName} · {formatDateTime(note.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                  <form onSubmit={handleAddNote} className="mt-3">
                    <textarea
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                      rows={2}
                      placeholder="Add an internal note..."
                      className={inputClass}
                    />
                    <button
                      type="submit"
                      className="mt-2 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
                    >
                      Add note
                    </button>
                  </form>
                </section>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                Select an application to review.
              </p>
            )}
          </div>
        </div>
      )}

      {showJobForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleSaveJob}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-bold text-zinc-900">
              {editingJobId ? "Edit job" : "Create job"}
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600">
                  Title *
                </label>
                <input
                  required
                  className={inputClass}
                  value={jobForm.title}
                  onChange={(e) =>
                    setJobForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600">
                  Department
                </label>
                <select
                  className={inputClass}
                  value={jobForm.department}
                  onChange={(e) =>
                    setJobForm((f) => ({
                      ...f,
                      department: e.target.value as JobDepartment,
                    }))
                  }
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {JOB_DEPARTMENT_LABELS[d]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600">
                  Location
                </label>
                <input
                  className={inputClass}
                  value={jobForm.location}
                  onChange={(e) =>
                    setJobForm((f) => ({ ...f, location: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600">
                  Salary
                </label>
                <input
                  className={inputClass}
                  value={jobForm.salary}
                  onChange={(e) =>
                    setJobForm((f) => ({ ...f, salary: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600">
                  Contract
                </label>
                <select
                  className={inputClass}
                  value={jobForm.contractType}
                  onChange={(e) =>
                    setJobForm((f) => ({
                      ...f,
                      contractType: e.target.value as ContractType,
                    }))
                  }
                >
                  {Object.entries(CONTRACT_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600">
                  Work location
                </label>
                <select
                  className={inputClass}
                  value={jobForm.workLocation}
                  onChange={(e) =>
                    setJobForm((f) => ({
                      ...f,
                      workLocation: e.target.value as WorkLocationType,
                    }))
                  }
                >
                  {Object.entries(WORK_LOCATION_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600">
                  Status
                </label>
                <select
                  className={inputClass}
                  value={jobForm.status}
                  onChange={(e) =>
                    setJobForm((f) => ({
                      ...f,
                      status: e.target.value as JobStatus,
                    }))
                  }
                >
                  {Object.entries(JOB_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600">
                  Description
                </label>
                <textarea
                  rows={3}
                  className={inputClass}
                  value={jobForm.description}
                  onChange={(e) =>
                    setJobForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600">
                  Responsibilities (one per line)
                </label>
                <textarea
                  rows={4}
                  className={inputClass}
                  value={jobForm.responsibilities}
                  onChange={(e) =>
                    setJobForm((f) => ({
                      ...f,
                      responsibilities: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600">
                  Requirements (one per line)
                </label>
                <textarea
                  rows={4}
                  className={inputClass}
                  value={jobForm.requirements}
                  onChange={(e) =>
                    setJobForm((f) => ({
                      ...f,
                      requirements: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600">
                  Benefits (one per line)
                </label>
                <textarea
                  rows={3}
                  className={inputClass}
                  value={jobForm.benefits}
                  onChange={(e) =>
                    setJobForm((f) => ({ ...f, benefits: e.target.value }))
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={jobForm.featuredOnHomepage}
                  onChange={(e) =>
                    setJobForm((f) => ({
                      ...f,
                      featuredOnHomepage: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded text-violet-600"
                />
                Feature on homepage
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowJobForm(false)}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
