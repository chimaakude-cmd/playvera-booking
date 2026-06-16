import {
  CALLBACK_REQUEST_NOTES_KEY,
  CALLBACK_REQUESTS_KEY,
  SEED_CALLBACK_REQUEST_NOTES,
  SEED_CALLBACK_REQUESTS,
} from "./defaults";
import { sendConfirmationEmail } from "./email";
import type {
  CallbackRequest,
  CallbackRequestNote,
  CallbackRequestStatus,
  CreateCallbackRequestInput,
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
  if (!localStorage.getItem(CALLBACK_REQUESTS_KEY)) {
    writeJson(CALLBACK_REQUESTS_KEY, SEED_CALLBACK_REQUESTS);
    writeJson(CALLBACK_REQUEST_NOTES_KEY, SEED_CALLBACK_REQUEST_NOTES);
  }
}

export function getCallbackRequests(options?: {
  includeArchived?: boolean;
}): CallbackRequest[] {
  ensureSeeded();
  const includeArchived = options?.includeArchived ?? false;
  const requests = readJson<CallbackRequest[]>(CALLBACK_REQUESTS_KEY, []);
  return [...requests]
    .filter((request) => includeArchived || !request.archived)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export function getCallbackRequestById(id: string): CallbackRequest | null {
  return getCallbackRequests({ includeArchived: true }).find(
    (request) => request.id === id,
  ) ?? null;
}

export function createCallbackRequest(
  input: CreateCallbackRequestInput,
): { request: CallbackRequest; confirmationMailto: string } {
  ensureSeeded();
  const requests = readJson<CallbackRequest[]>(CALLBACK_REQUESTS_KEY, []);
  const now = nowIso();

  const request: CallbackRequest = {
    id: createId("callback"),
    fullName: input.fullName.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    organisation: input.organisation.trim(),
    reason: input.reason,
    preferredDate: input.preferredDate.trim(),
    preferredTime: input.preferredTime.trim(),
    additionalNotes: input.additionalNotes.trim(),
    consentGiven: input.consentGiven,
    status: "new",
    assignedAdminId: null,
    assignedAdminName: null,
    emailSent: true,
    archived: false,
    createdAt: now,
    updatedAt: now,
  };

  writeJson(CALLBACK_REQUESTS_KEY, [request, ...requests]);

  const { mailtoHref } = sendConfirmationEmail({
    name: request.fullName,
    email: request.email,
    topic: request.reason,
    preferredDate: request.preferredDate,
    preferredTime: request.preferredTime,
  });

  return { request, confirmationMailto: mailtoHref };
}

export function updateCallbackRequestStatus(
  id: string,
  status: CallbackRequestStatus,
): CallbackRequest | null {
  ensureSeeded();
  const requests = readJson<CallbackRequest[]>(CALLBACK_REQUESTS_KEY, []);
  const index = requests.findIndex((request) => request.id === id);
  if (index === -1) {
    return null;
  }
  const updated: CallbackRequest = {
    ...requests[index],
    status,
    updatedAt: nowIso(),
  };
  requests[index] = updated;
  writeJson(CALLBACK_REQUESTS_KEY, requests);
  return updated;
}

export function assignCallbackRequest(
  id: string,
  adminId: string,
  adminName: string,
): CallbackRequest | null {
  ensureSeeded();
  const requests = readJson<CallbackRequest[]>(CALLBACK_REQUESTS_KEY, []);
  const index = requests.findIndex((request) => request.id === id);
  if (index === -1) {
    return null;
  }
  const updated: CallbackRequest = {
    ...requests[index],
    assignedAdminId: adminId,
    assignedAdminName: adminName,
    updatedAt: nowIso(),
  };
  requests[index] = updated;
  writeJson(CALLBACK_REQUESTS_KEY, requests);
  return updated;
}

export function archiveCallbackRequest(id: string): CallbackRequest | null {
  ensureSeeded();
  const requests = readJson<CallbackRequest[]>(CALLBACK_REQUESTS_KEY, []);
  const index = requests.findIndex((request) => request.id === id);
  if (index === -1) {
    return null;
  }
  const updated: CallbackRequest = {
    ...requests[index],
    archived: true,
    status: "closed",
    updatedAt: nowIso(),
  };
  requests[index] = updated;
  writeJson(CALLBACK_REQUESTS_KEY, requests);
  return updated;
}

export function getCallbackRequestNotes(
  requestId: string,
): CallbackRequestNote[] {
  ensureSeeded();
  const notes = readJson<CallbackRequestNote[]>(
    CALLBACK_REQUEST_NOTES_KEY,
    [],
  );
  return notes
    .filter((note) => note.requestId === requestId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
}

type AddNoteInput = Omit<CallbackRequestNote, "id" | "createdAt">;

export function addCallbackRequestNote(input: AddNoteInput): CallbackRequestNote {
  ensureSeeded();
  const notes = readJson<CallbackRequestNote[]>(
    CALLBACK_REQUEST_NOTES_KEY,
    [],
  );
  const note: CallbackRequestNote = {
    ...input,
    id: createId("cnote"),
    createdAt: nowIso(),
  };
  writeJson(CALLBACK_REQUEST_NOTES_KEY, [...notes, note]);

  const requests = readJson<CallbackRequest[]>(CALLBACK_REQUESTS_KEY, []);
  const index = requests.findIndex((request) => request.id === input.requestId);
  if (index !== -1) {
    requests[index] = { ...requests[index], updatedAt: nowIso() };
    writeJson(CALLBACK_REQUESTS_KEY, requests);
  }

  return note;
}
