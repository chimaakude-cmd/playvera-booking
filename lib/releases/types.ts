export type ReleaseCategory =
  | "feature"
  | "improvement"
  | "fix"
  | "security"
  | "performance";

export type ReleaseStatus = "draft" | "published" | "scheduled" | "hidden";

export type ReleaseNoteVerb = "added" | "improved" | "fixed" | "removed";

export type Release = {
  id: string;
  title: string;
  description: string;
  type: ReleaseCategory;
  version: string;
  releaseDate: string;
  summary: string;
  details: string[];
  status: ReleaseStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReleaseSettings = {
  autoGenerateReleaseNotes: boolean;
};

export type CreateReleaseInput = {
  title: string;
  description: string;
  type: ReleaseCategory;
  version: string;
  releaseDate: string;
  summary: string;
  details: string[];
  status?: ReleaseStatus;
  scheduledAt?: string | null;
};

export type UpdateReleaseInput = Partial<CreateReleaseInput> & {
  status?: ReleaseStatus;
  publishedAt?: string | null;
};

export const RELEASE_CATEGORY_LABELS: Record<ReleaseCategory, string> = {
  feature: "Feature",
  improvement: "Improvement",
  fix: "Fix",
  security: "Security",
  performance: "Performance",
};

export const RELEASE_STATUS_LABELS: Record<ReleaseStatus, string> = {
  draft: "Draft",
  published: "Published",
  scheduled: "Scheduled",
  hidden: "Hidden",
};

export const RELEASE_NOTE_VERB_LABELS: Record<ReleaseNoteVerb, string> = {
  added: "Added",
  improved: "Improved",
  fixed: "Fixed",
  removed: "Removed",
};

export const VERSION_STRATEGY = [
  { version: "0.5", label: "Foundation — core booking, onboarding, transparency" },
  { version: "0.6", label: "Registers & attendance improvements" },
  { version: "0.7", label: "Communications & templates" },
  { version: "0.8", label: "Growth tools & website widget" },
  { version: "0.9", label: "Partnerships & marketplace polish" },
  { version: "1.0", label: "General availability" },
  { version: "1.1", label: "Performance & scale" },
  { version: "1.2", label: "Enterprise & integrations" },
] as const;

export const CURRENT_VERSION = "0.5";
