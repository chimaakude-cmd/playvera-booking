import type { ApplicationNote, CareerAuditLogEntry, CareerJob, JobApplication } from "./types";

export const CAREERS_JOBS_KEY = "activora-careers-jobs";
export const CAREERS_APPLICATIONS_KEY = "activora-careers-applications";
export const CAREERS_TALENT_POOL_KEY = "activora-careers-talent-pool";
export const CAREERS_APPLICATION_NOTES_KEY = "activora-careers-application-notes";
export const CAREERS_AUDIT_LOG_KEY = "activora-careers-audit-log";

/** Max data-URL CV size stored in localStorage (bytes). */
export const MAX_CV_DATA_URL_BYTES = 500_000;

/** Empty initial storage — no demo jobs. */
export const SEED_CAREER_JOBS: CareerJob[] = [];
export const SEED_JOB_APPLICATIONS: JobApplication[] = [];
export const SEED_APPLICATION_NOTES: ApplicationNote[] = [];
export const SEED_CAREER_AUDIT_LOG: CareerAuditLogEntry[] = [];
