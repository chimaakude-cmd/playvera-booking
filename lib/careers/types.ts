/**
 * Careers types — localStorage today, Supabase later.
 */

export type JobDepartment =
  | "sales"
  | "customer_success"
  | "engineering"
  | "operations"
  | "marketing"
  | "coaching"
  | "support";

export type WorkLocationType = "remote" | "hybrid" | "office";

export type ContractType =
  | "full_time"
  | "part_time"
  | "contract"
  | "freelance";

export type JobStatus =
  | "draft"
  | "open"
  | "closed"
  | "archived"
  | "deleted";

export type ApplicationStatus =
  | "new"
  | "reviewing"
  | "interview"
  | "offer"
  | "rejected"
  | "hired";

export type CareerJob = {
  id: string;
  slug: string;
  title: string;
  department: JobDepartment;
  location: string;
  salary: string;
  contractType: ContractType;
  workLocation: WorkLocationType;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  status: JobStatus;
  featuredOnHomepage: boolean;
  views: number;
  postedAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  deletedBy?: string | null;
  deletedByName?: string | null;
};

export type CareerAuditAction =
  | "job_created"
  | "job_updated"
  | "job_status_changed"
  | "job_deleted"
  | "job_archived"
  | "jobs_bulk_archived"
  | "jobs_bulk_deleted";

export type CareerAuditLogEntry = {
  id: string;
  action: CareerAuditAction;
  jobId: string;
  jobTitle: string;
  actorId: string;
  actorName: string;
  details?: string;
  createdAt: string;
};

export type JobApplication = {
  id: string;
  jobId: string;
  jobTitle: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  cvDataUrl: string | null;
  cvFileName: string | null;
  coverNote: string;
  linkedInUrl: string;
  availability: string;
  rightToWork: boolean;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationNote = {
  id: string;
  applicationId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type TalentPoolSubmission = {
  id: string;
  name: string;
  email: string;
  cvDataUrl: string | null;
  cvFileName: string | null;
  interestAreas: string[];
  createdAt: string;
};

export type CreateJobInput = Omit<
  CareerJob,
  "id" | "slug" | "views" | "createdAt" | "updatedAt" | "postedAt"
> & {
  slug?: string;
  postedAt?: string;
};

export type UpdateJobInput = Partial<
  Omit<CareerJob, "id" | "createdAt" | "updatedAt">
>;

export type CreateApplicationInput = {
  jobId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  cvDataUrl: string | null;
  cvFileName: string | null;
  coverNote: string;
  linkedInUrl: string;
  availability: string;
  rightToWork: boolean;
};

export type CreateTalentPoolInput = {
  name: string;
  email: string;
  cvDataUrl: string | null;
  cvFileName: string | null;
  interestAreas: string[];
};

export const JOB_DEPARTMENT_LABELS: Record<JobDepartment, string> = {
  sales: "Sales",
  customer_success: "Customer Success",
  engineering: "Engineering",
  operations: "Operations",
  marketing: "Marketing",
  coaching: "Coaching",
  support: "Support",
};

export const WORK_LOCATION_LABELS: Record<WorkLocationType, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  office: "Office",
};

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  freelance: "Freelance",
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
  archived: "Archived",
  deleted: "Deleted",
};

export type JobListFilter = "all" | "active" | "closed" | "archived" | "deleted";

export const JOB_LIST_FILTER_LABELS: Record<JobListFilter, string> = {
  all: "All",
  active: "Active",
  closed: "Closed",
  archived: "Archived",
  deleted: "Deleted",
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  hired: "Hired",
};

export const TALENT_POOL_INTEREST_AREAS = [
  "Sales",
  "Customer Success",
  "Engineering",
  "Operations",
  "Marketing",
  "Coaching",
  "Support",
] as const;
