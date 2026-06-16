import {
  PARTNERSHIP_ENQUIRIES_KEY,
  PARTNERSHIP_NOTES_KEY,
  SEED_PARTNERSHIP_ENQUIRIES,
  SEED_PARTNERSHIP_NOTES,
} from "./defaults";
import type {
  CreatePartnershipEnquiryInput,
  PartnershipEnquiry,
  PartnershipEnquiryStatus,
  PartnershipNote,
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
  if (!localStorage.getItem(PARTNERSHIP_ENQUIRIES_KEY)) {
    writeJson(PARTNERSHIP_ENQUIRIES_KEY, SEED_PARTNERSHIP_ENQUIRIES);
    writeJson(PARTNERSHIP_NOTES_KEY, SEED_PARTNERSHIP_NOTES);
  }
}

export function getPartnershipEnquiries(): PartnershipEnquiry[] {
  ensureSeeded();
  const enquiries = readJson<PartnershipEnquiry[]>(
    PARTNERSHIP_ENQUIRIES_KEY,
    [],
  );
  return [...enquiries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getPartnershipEnquiryById(
  id: string,
): PartnershipEnquiry | null {
  return getPartnershipEnquiries().find((enquiry) => enquiry.id === id) ?? null;
}

export function createPartnershipEnquiry(
  input: CreatePartnershipEnquiryInput,
): PartnershipEnquiry {
  ensureSeeded();
  const enquiries = readJson<PartnershipEnquiry[]>(PARTNERSHIP_ENQUIRIES_KEY, []);
  const now = nowIso();
  const enquiry: PartnershipEnquiry = {
    organisationName: input.organisationName.trim(),
    website: input.website.trim(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    partnershipCategory: input.partnershipCategory,
    country: input.country.trim(),
    proposedIdea: input.proposedIdea.trim(),
    expectedOutcomes: input.expectedOutcomes.trim(),
    preferredMeetingDate: input.preferredMeetingDate.trim(),
    additionalInformation: input.additionalInformation.trim(),
    id: createId("partner"),
    status: "new",
    assignedAdminId: null,
    assignedAdminName: null,
    followUpDate: null,
    createdAt: now,
    updatedAt: now,
  };
  writeJson(PARTNERSHIP_ENQUIRIES_KEY, [enquiry, ...enquiries]);
  return enquiry;
}

export function updatePartnershipEnquiryStatus(
  id: string,
  status: PartnershipEnquiryStatus,
): PartnershipEnquiry | null {
  ensureSeeded();
  const enquiries = readJson<PartnershipEnquiry[]>(PARTNERSHIP_ENQUIRIES_KEY, []);
  const index = enquiries.findIndex((enquiry) => enquiry.id === id);
  if (index === -1) {
    return null;
  }
  const updated: PartnershipEnquiry = {
    ...enquiries[index],
    status,
    updatedAt: nowIso(),
  };
  enquiries[index] = updated;
  writeJson(PARTNERSHIP_ENQUIRIES_KEY, enquiries);
  return updated;
}

export function assignPartnershipEnquiry(
  id: string,
  adminId: string,
  adminName: string,
): PartnershipEnquiry | null {
  ensureSeeded();
  const enquiries = readJson<PartnershipEnquiry[]>(PARTNERSHIP_ENQUIRIES_KEY, []);
  const index = enquiries.findIndex((enquiry) => enquiry.id === id);
  if (index === -1) {
    return null;
  }
  const updated: PartnershipEnquiry = {
    ...enquiries[index],
    assignedAdminId: adminId,
    assignedAdminName: adminName,
    updatedAt: nowIso(),
  };
  enquiries[index] = updated;
  writeJson(PARTNERSHIP_ENQUIRIES_KEY, enquiries);
  return updated;
}

export function schedulePartnershipFollowUp(
  id: string,
  followUpDate: string,
): PartnershipEnquiry | null {
  ensureSeeded();
  const enquiries = readJson<PartnershipEnquiry[]>(PARTNERSHIP_ENQUIRIES_KEY, []);
  const index = enquiries.findIndex((enquiry) => enquiry.id === id);
  if (index === -1) {
    return null;
  }
  const updated: PartnershipEnquiry = {
    ...enquiries[index],
    followUpDate,
    updatedAt: nowIso(),
  };
  enquiries[index] = updated;
  writeJson(PARTNERSHIP_ENQUIRIES_KEY, enquiries);
  return updated;
}

export function getPartnershipNotes(enquiryId: string): PartnershipNote[] {
  ensureSeeded();
  const notes = readJson<PartnershipNote[]>(PARTNERSHIP_NOTES_KEY, []);
  return notes
    .filter((note) => note.enquiryId === enquiryId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
}

type AddNoteInput = Omit<PartnershipNote, "id" | "createdAt">;

export function addPartnershipNote(input: AddNoteInput): PartnershipNote {
  ensureSeeded();
  const notes = readJson<PartnershipNote[]>(PARTNERSHIP_NOTES_KEY, []);
  const note: PartnershipNote = {
    ...input,
    id: createId("pnote"),
    createdAt: nowIso(),
  };
  writeJson(PARTNERSHIP_NOTES_KEY, [...notes, note]);

  const enquiries = readJson<PartnershipEnquiry[]>(PARTNERSHIP_ENQUIRIES_KEY, []);
  const index = enquiries.findIndex((enquiry) => enquiry.id === input.enquiryId);
  if (index !== -1) {
    enquiries[index] = { ...enquiries[index], updatedAt: nowIso() };
    writeJson(PARTNERSHIP_ENQUIRIES_KEY, enquiries);
  }

  return note;
}

export function exportPartnershipEnquiriesJson(): string {
  return JSON.stringify(getPartnershipEnquiries(), null, 2);
}
