import { DEMO_ENQUIRIES_KEY, SEED_DEMO_ENQUIRIES } from "./defaults";
import type {
  CreateDemoEnquiryInput,
  DemoEnquiry,
  DemoEnquiryStatus,
} from "./types";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function createId(): string {
  return `demo_${crypto.randomUUID().slice(0, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function readJson<T>(fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }
  try {
    const raw = localStorage.getItem(DEMO_ENQUIRIES_KEY);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(value: DemoEnquiry[]): void {
  if (!isBrowser()) {
    return;
  }
  localStorage.setItem(DEMO_ENQUIRIES_KEY, JSON.stringify(value));
}

export function getDemoEnquiries(): DemoEnquiry[] {
  const enquiries = readJson(SEED_DEMO_ENQUIRIES);
  return [...enquiries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getDemoEnquiryById(id: string): DemoEnquiry | null {
  return getDemoEnquiries().find((enquiry) => enquiry.id === id) ?? null;
}

export function createDemoEnquiry(input: CreateDemoEnquiryInput): DemoEnquiry {
  const enquiries = readJson<DemoEnquiry[]>([]);
  const now = nowIso();
  const enquiry: DemoEnquiry = {
    ...input,
    clubName: input.clubName.trim(),
    businessEmail: input.businessEmail.trim(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    businessPhone: input.businessPhone.trim(),
    jobRole: input.jobRole.trim(),
    programmeSize: input.programmeSize.trim(),
    activityType: input.activityType.trim(),
    startTimeline: input.startTimeline.trim(),
    additionalInfo: input.additionalInfo.trim(),
    id: createId(),
    status: "new",
    createdAt: now,
    updatedAt: now,
  };
  writeJson([enquiry, ...enquiries]);
  return enquiry;
}

export function updateDemoEnquiryStatus(
  id: string,
  status: DemoEnquiryStatus,
): DemoEnquiry | null {
  const enquiries = readJson<DemoEnquiry[]>([]);
  const index = enquiries.findIndex((enquiry) => enquiry.id === id);
  if (index === -1) {
    return null;
  }
  const updated: DemoEnquiry = {
    ...enquiries[index],
    status,
    updatedAt: nowIso(),
  };
  enquiries[index] = updated;
  writeJson(enquiries);
  return updated;
}
