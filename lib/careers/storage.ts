import { isDataUrl } from "@/lib/image-urls";
import { appendCareerAuditLog } from "./audit";
import {
  CAREERS_APPLICATION_NOTES_KEY,
  CAREERS_APPLICATIONS_KEY,
  CAREERS_AUDIT_LOG_KEY,
  CAREERS_JOBS_KEY,
  CAREERS_TALENT_POOL_KEY,
  SEED_APPLICATION_NOTES,
  SEED_CAREER_AUDIT_LOG,
  SEED_CAREER_JOBS,
  SEED_JOB_APPLICATIONS,
  MAX_CV_DATA_URL_BYTES,
} from "./defaults";
import type {
  ApplicationNote,
  ApplicationStatus,
  CareerJob,
  CreateApplicationInput,
  CreateJobInput,
  CreateTalentPoolInput,
  JobApplication,
  JobListFilter,
  JobStatus,
  TalentPoolSubmission,
  UpdateJobInput,
} from "./types";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (!isBrowser()) {
    return;
  }
  localStorage.setItem(key, JSON.stringify(value));
}

function ensureSeeded(): void {
  if (!isBrowser()) {
    return;
  }
  if (!localStorage.getItem(CAREERS_JOBS_KEY)) {
    writeJson(CAREERS_JOBS_KEY, SEED_CAREER_JOBS);
    writeJson(CAREERS_APPLICATIONS_KEY, SEED_JOB_APPLICATIONS);
    writeJson(CAREERS_APPLICATION_NOTES_KEY, SEED_APPLICATION_NOTES);
    writeJson(CAREERS_TALENT_POOL_KEY, []);
    writeJson(CAREERS_AUDIT_LOG_KEY, SEED_CAREER_AUDIT_LOG);
  }
}

export function isDeletedCareerJob(job: CareerJob): boolean {
  return job.status === "deleted" || Boolean(job.deletedAt);
}

function isNonDeletedCareerJob(job: CareerJob): boolean {
  return !isDeletedCareerJob(job);
}

function isPublicJob(job: CareerJob): boolean {
  return (
    isNonDeletedCareerJob(job) &&
    job.status !== "archived" &&
    job.status !== "draft"
  );
}

function isActiveJob(job: CareerJob): boolean {
  return job.status === "open" || job.status === "draft";
}

export function filterCareerJobs(
  jobs: CareerJob[],
  filter: JobListFilter,
): CareerJob[] {
  switch (filter) {
    case "deleted":
      return jobs.filter(isDeletedCareerJob);
    case "active":
      return jobs.filter(
        (job) => isNonDeletedCareerJob(job) && isActiveJob(job),
      );
    case "closed":
      return jobs.filter(
        (job) => isNonDeletedCareerJob(job) && job.status === "closed",
      );
    case "archived":
      return jobs.filter(
        (job) => isNonDeletedCareerJob(job) && job.status === "archived",
      );
    default:
      return jobs.filter(isNonDeletedCareerJob);
  }
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function uniqueSlug(title: string, existing: CareerJob[], excludeId?: string): string {
  const base = slugify(title);
  let slug = base;
  let counter = 2;
  while (
    existing.some((job) => job.slug === slug && job.id !== excludeId)
  ) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  return slug;
}

/** Persist CV as data URL if under size limit, else store metadata only. */
export function sanitizeCvDataUrl(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }
  if (isDataUrl(value) && value.length <= MAX_CV_DATA_URL_BYTES) {
    return value;
  }
  return null;
}

export function getCareerJobs(): CareerJob[] {
  ensureSeeded();
  const jobs = readJson<CareerJob[]>(CAREERS_JOBS_KEY, []);
  return [...jobs].sort(
    (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(),
  );
}

export function getOpenCareerJobs(): CareerJob[] {
  return getCareerJobs().filter(
    (job) => isNonDeletedCareerJob(job) && job.status === "open",
  );
}

export function getPublicCareerJobBySlugOrId(
  slugOrId: string,
): CareerJob | null {
  const job = getCareerJobBySlugOrId(slugOrId);
  if (!job || !isPublicJob(job)) {
    return null;
  }
  return job;
}

export function getCareerJobById(id: string): CareerJob | null {
  return getCareerJobs().find((job) => job.id === id) ?? null;
}

export function getCareerJobBySlug(slug: string): CareerJob | null {
  return getCareerJobs().find((job) => job.slug === slug) ?? null;
}

export function getCareerJobBySlugOrId(slugOrId: string): CareerJob | null {
  return (
    getCareerJobBySlug(slugOrId) ?? getCareerJobById(slugOrId) ?? null
  );
}

export function incrementJobViews(id: string): void {
  ensureSeeded();
  const jobs = readJson<CareerJob[]>(CAREERS_JOBS_KEY, []);
  const index = jobs.findIndex((job) => job.id === id);
  if (index === -1) {
    return;
  }
  jobs[index] = {
    ...jobs[index],
    views: jobs[index].views + 1,
    updatedAt: nowIso(),
  };
  writeJson(CAREERS_JOBS_KEY, jobs);
}

export function createCareerJob(input: CreateJobInput): CareerJob {
  ensureSeeded();
  const jobs = readJson<CareerJob[]>(CAREERS_JOBS_KEY, []);
  const now = nowIso();
  const slug =
    input.slug?.trim() || uniqueSlug(input.title, jobs);
  const job: CareerJob = {
    id: createId("job"),
    slug,
    title: input.title.trim(),
    department: input.department,
    location: input.location.trim(),
    salary: input.salary.trim(),
    contractType: input.contractType,
    workLocation: input.workLocation,
    description: input.description.trim(),
    responsibilities: input.responsibilities.filter(Boolean),
    requirements: input.requirements.filter(Boolean),
    benefits: input.benefits.filter(Boolean),
    status: input.status,
    featuredOnHomepage: input.featuredOnHomepage,
    views: 0,
    postedAt: input.postedAt || now,
    createdAt: now,
    updatedAt: now,
  };
  writeJson(CAREERS_JOBS_KEY, [job, ...jobs]);
  return job;
}

export function updateCareerJob(
  id: string,
  input: UpdateJobInput,
): CareerJob | null {
  ensureSeeded();
  const jobs = readJson<CareerJob[]>(CAREERS_JOBS_KEY, []);
  const index = jobs.findIndex((job) => job.id === id);
  if (index === -1) {
    return null;
  }
  const current = jobs[index];
  const title = input.title?.trim() ?? current.title;
  const slug =
    input.slug?.trim() ||
    (input.title ? uniqueSlug(title, jobs, id) : current.slug);
  const updated: CareerJob = {
    ...current,
    ...input,
    title,
    slug,
    location: input.location?.trim() ?? current.location,
    salary: input.salary?.trim() ?? current.salary,
    description: input.description?.trim() ?? current.description,
    responsibilities: input.responsibilities ?? current.responsibilities,
    requirements: input.requirements ?? current.requirements,
    benefits: input.benefits ?? current.benefits,
    updatedAt: nowIso(),
  };
  jobs[index] = updated;
  writeJson(CAREERS_JOBS_KEY, jobs);
  return updated;
}

export function setCareerJobStatus(id: string, status: JobStatus): CareerJob | null {
  return updateCareerJob(id, { status });
}

export type DeleteJobOptions = {
  retainApplications: boolean;
  actorId: string;
  actorName: string;
};

export function deleteJob(id: string, options: DeleteJobOptions): CareerJob | null {
  ensureSeeded();
  const jobs = readJson<CareerJob[]>(CAREERS_JOBS_KEY, []);
  const index = jobs.findIndex((job) => job.id === id);
  if (index === -1) {
    return null;
  }
  const current = jobs[index];
  if (current.status === "deleted") {
    return current;
  }

  const now = nowIso();
  const deleted: CareerJob = {
    ...current,
    status: "deleted",
    featuredOnHomepage: false,
    deletedAt: now,
    deletedBy: options.actorId,
    deletedByName: options.actorName,
    updatedAt: now,
  };
  jobs[index] = deleted;
  writeJson(CAREERS_JOBS_KEY, jobs);

  if (!options.retainApplications) {
    removeApplicationsForJob(id);
  }

  appendCareerAuditLog({
    action: "job_deleted",
    jobId: id,
    jobTitle: current.title,
    actorId: options.actorId,
    actorName: options.actorName,
    details: options.retainApplications
      ? "Applications retained"
      : "Applications removed",
  });

  return deleted;
}

function removeApplicationsForJob(jobId: string): void {
  const applications = readJson<JobApplication[]>(CAREERS_APPLICATIONS_KEY, []);
  const removedIds = new Set(
    applications.filter((app) => app.jobId === jobId).map((app) => app.id),
  );
  if (removedIds.size === 0) {
    return;
  }
  writeJson(
    CAREERS_APPLICATIONS_KEY,
    applications.filter((app) => app.jobId !== jobId),
  );
  const notes = readJson<ApplicationNote[]>(CAREERS_APPLICATION_NOTES_KEY, []);
  writeJson(
    CAREERS_APPLICATION_NOTES_KEY,
    notes.filter((note) => !removedIds.has(note.applicationId)),
  );
}

export function bulkArchiveCareerJobs(
  ids: string[],
  actor: { actorId: string; actorName: string },
): number {
  let count = 0;
  for (const id of ids) {
    const job = setCareerJobStatus(id, "archived");
    if (job) {
      count += 1;
      appendCareerAuditLog({
        action: "jobs_bulk_archived",
        jobId: id,
        jobTitle: job.title,
        actorId: actor.actorId,
        actorName: actor.actorName,
      });
    }
  }
  return count;
}

export function bulkDeleteCareerJobs(
  ids: string[],
  options: DeleteJobOptions,
): number {
  let count = 0;
  for (const id of ids) {
    if (deleteJob(id, options)) {
      count += 1;
    }
  }
  return count;
}

export function exportCareerJobsJson(jobIds?: string[]): string {
  const jobs = getCareerJobs();
  const selected =
    jobIds && jobIds.length > 0
      ? jobs.filter((job) => jobIds.includes(job.id))
      : jobs;
  const applications = getJobApplications().filter((app) =>
    selected.some((job) => job.id === app.jobId),
  );
  return JSON.stringify({ jobs: selected, applications }, null, 2);
}

export function duplicateCareerJob(id: string): CareerJob | null {
  const source = getCareerJobById(id);
  if (!source) {
    return null;
  }
  return createCareerJob({
    title: `${source.title} (copy)`,
    department: source.department,
    location: source.location,
    salary: source.salary,
    contractType: source.contractType,
    workLocation: source.workLocation,
    description: source.description,
    responsibilities: [...source.responsibilities],
    requirements: [...source.requirements],
    benefits: [...source.benefits],
    status: "open",
    featuredOnHomepage: false,
    postedAt: nowIso(),
  });
}

export function getJobApplications(): JobApplication[] {
  ensureSeeded();
  const applications = readJson<JobApplication[]>(CAREERS_APPLICATIONS_KEY, []);
  return [...applications].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getApplicationsForJob(jobId: string): JobApplication[] {
  return getJobApplications().filter((app) => app.jobId === jobId);
}

export function getJobApplicationById(id: string): JobApplication | null {
  return getJobApplications().find((app) => app.id === id) ?? null;
}

export function createJobApplication(
  input: CreateApplicationInput,
): JobApplication | null {
  ensureSeeded();
  const job = getCareerJobById(input.jobId);
  if (!job || job.status !== "open" || isDeletedCareerJob(job)) {
    return null;
  }
  const applications = readJson<JobApplication[]>(CAREERS_APPLICATIONS_KEY, []);
  const now = nowIso();
  const application: JobApplication = {
    id: createId("app"),
    jobId: input.jobId,
    jobTitle: job.title,
    candidateName: input.candidateName.trim(),
    candidateEmail: input.candidateEmail.trim(),
    candidatePhone: input.candidatePhone.trim(),
    cvDataUrl: sanitizeCvDataUrl(input.cvDataUrl),
    cvFileName: input.cvFileName,
    coverNote: input.coverNote.trim(),
    linkedInUrl: input.linkedInUrl.trim(),
    availability: input.availability.trim(),
    rightToWork: input.rightToWork,
    status: "new",
    createdAt: now,
    updatedAt: now,
  };
  writeJson(CAREERS_APPLICATIONS_KEY, [application, ...applications]);
  return application;
}

export function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
): JobApplication | null {
  ensureSeeded();
  const applications = readJson<JobApplication[]>(CAREERS_APPLICATIONS_KEY, []);
  const index = applications.findIndex((app) => app.id === id);
  if (index === -1) {
    return null;
  }
  const updated: JobApplication = {
    ...applications[index],
    status,
    updatedAt: nowIso(),
  };
  applications[index] = updated;
  writeJson(CAREERS_APPLICATIONS_KEY, applications);
  return updated;
}

export function getApplicationNotes(applicationId: string): ApplicationNote[] {
  ensureSeeded();
  const notes = readJson<ApplicationNote[]>(CAREERS_APPLICATION_NOTES_KEY, []);
  return notes
    .filter((note) => note.applicationId === applicationId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
}

export function addApplicationNote(input: {
  applicationId: string;
  authorId: string;
  authorName: string;
  body: string;
}): ApplicationNote {
  ensureSeeded();
  const notes = readJson<ApplicationNote[]>(CAREERS_APPLICATION_NOTES_KEY, []);
  const note: ApplicationNote = {
    id: createId("appnote"),
    applicationId: input.applicationId,
    authorId: input.authorId,
    authorName: input.authorName,
    body: input.body.trim(),
    createdAt: nowIso(),
  };
  writeJson(CAREERS_APPLICATION_NOTES_KEY, [...notes, note]);

  const applications = readJson<JobApplication[]>(CAREERS_APPLICATIONS_KEY, []);
  const index = applications.findIndex(
    (app) => app.id === input.applicationId,
  );
  if (index !== -1) {
    applications[index] = {
      ...applications[index],
      updatedAt: nowIso(),
    };
    writeJson(CAREERS_APPLICATIONS_KEY, applications);
  }

  return note;
}

export function getTalentPoolSubmissions(): TalentPoolSubmission[] {
  ensureSeeded();
  const submissions = readJson<TalentPoolSubmission[]>(
    CAREERS_TALENT_POOL_KEY,
    [],
  );
  return [...submissions].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function createTalentPoolSubmission(
  input: CreateTalentPoolInput,
): TalentPoolSubmission {
  ensureSeeded();
  const submissions = readJson<TalentPoolSubmission[]>(
    CAREERS_TALENT_POOL_KEY,
    [],
  );
  const submission: TalentPoolSubmission = {
    id: createId("talent"),
    name: input.name.trim(),
    email: input.email.trim(),
    cvDataUrl: sanitizeCvDataUrl(input.cvDataUrl),
    cvFileName: input.cvFileName,
    interestAreas: input.interestAreas,
    createdAt: nowIso(),
  };
  writeJson(CAREERS_TALENT_POOL_KEY, [submission, ...submissions]);
  return submission;
}

export function getCareersAnalytics(): {
  totalApplications: number;
  totalViews: number;
  conversionRate: number;
  pipeline: Record<ApplicationStatus, number>;
} {
  const activeJobs = getCareerJobs().filter(
    (job) => isNonDeletedCareerJob(job) && job.status !== "archived",
  );
  const activeJobIds = new Set(activeJobs.map((job) => job.id));
  const applications = getJobApplications().filter((app) =>
    activeJobIds.has(app.jobId),
  );
  const totalViews = activeJobs.reduce((sum, job) => sum + job.views, 0);
  const totalApplications = applications.length;
  const conversionRate =
    totalViews > 0
      ? Math.round((totalApplications / totalViews) * 1000) / 10
      : 0;

  const pipeline: Record<ApplicationStatus, number> = {
    new: 0,
    reviewing: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    hired: 0,
  };
  for (const app of applications) {
    pipeline[app.status] += 1;
  }

  return { totalApplications, totalViews, conversionRate, pipeline };
}
