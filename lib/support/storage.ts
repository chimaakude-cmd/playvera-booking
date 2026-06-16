import { readAuthSession } from "@/lib/auth/session";
import {
  SEED_SUPPORT_STATE,
  SUPPORT_ASSIGNMENTS_KEY,
  SUPPORT_MESSAGES_KEY,
  SUPPORT_THREADS_KEY,
} from "./defaults";
import { canUseAi } from "./routing";
import type {
  CreateThreadInput,
  MessageType,
  SendSupportMessageInput,
  SupportAssignment,
  SupportMessage,
  SupportState,
  SupportThread,
  ThreadStatus,
} from "./types";

export const RECENTLY_DELETED_DAYS = 30;
export const AUTO_DELETE_MONTHS = 6;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function getDefaultState(): SupportState {
  return structuredClone(SEED_SUPPORT_STATE);
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
  const hasThreads = localStorage.getItem(SUPPORT_THREADS_KEY);
  if (!hasThreads) {
    writeJson(SUPPORT_THREADS_KEY, SEED_SUPPORT_STATE.threads);
    writeJson(SUPPORT_MESSAGES_KEY, SEED_SUPPORT_STATE.messages);
    writeJson(SUPPORT_ASSIGNMENTS_KEY, SEED_SUPPORT_STATE.assignments);
  }
}

export function getSupportState(): SupportState {
  ensureSeeded();
  return {
    threads: readJson(SUPPORT_THREADS_KEY, getDefaultState().threads),
    messages: readJson(SUPPORT_MESSAGES_KEY, getDefaultState().messages),
    assignments: readJson(
      SUPPORT_ASSIGNMENTS_KEY,
      getDefaultState().assignments,
    ),
  };
}

function saveThreads(threads: SupportThread[]): void {
  writeJson(SUPPORT_THREADS_KEY, threads);
}

function saveMessages(messages: SupportMessage[]): void {
  writeJson(SUPPORT_MESSAGES_KEY, messages);
}

function saveAssignments(assignments: SupportAssignment[]): void {
  writeJson(SUPPORT_ASSIGNMENTS_KEY, assignments);
}

function isDeleted(thread: SupportThread): boolean {
  return Boolean(thread.deletedAt);
}

function isArchived(thread: SupportThread): boolean {
  return Boolean(thread.archived || thread.archivedAt);
}

function sortByLastMessage(threads: SupportThread[]): SupportThread[] {
  return [...threads].sort(
    (a, b) =>
      new Date(b.last_message_at).getTime() -
      new Date(a.last_message_at).getTime(),
  );
}

export function getThreads(includeArchived = false): SupportThread[] {
  const threads = getSupportState().threads.filter((t) => !isDeleted(t));
  const filtered = includeArchived
    ? threads
    : threads.filter((t) => !isArchived(t));
  return sortByLastMessage(filtered);
}

export function getArchivedThreads(): SupportThread[] {
  return sortByLastMessage(
    getSupportState().threads.filter((t) => !isDeleted(t) && isArchived(t)),
  );
}

export function getRecentlyDeletedThreads(): SupportThread[] {
  const cutoff = Date.now() - RECENTLY_DELETED_DAYS * 24 * 60 * 60 * 1000;
  return sortByLastMessage(
    getSupportState().threads.filter((t) => {
      if (!t.deletedAt) {
        return false;
      }
      return new Date(t.deletedAt).getTime() >= cutoff;
    }),
  );
}

export function getThreadById(id: string): SupportThread | undefined {
  return getSupportState().threads.find((t) => t.id === id);
}

export function getMessagesForThread(threadId: string): SupportMessage[] {
  return getSupportState()
    .messages.filter((m) => m.thread_id === threadId)
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
}

export function getAssignmentForThread(
  threadId: string,
): SupportAssignment | undefined {
  return getSupportState().assignments.find((a) => a.thread_id === threadId);
}

export function getCurrentUserContact(): {
  name: string;
  email: string;
  user_id?: string;
} {
  const session = readAuthSession();
  if (session) {
    return {
      name: session.name,
      email: session.email,
      user_id: session.id,
    };
  }
  return { name: "Guest", email: "" };
}

export function createThread(input: CreateThreadInput): SupportThread {
  const state = getSupportState();
  const timestamp = nowIso();
  const thread: SupportThread = {
    id: createId("thread"),
    context: input.context,
    support_mode: input.support_mode,
    message_type: input.message_type ?? "general",
    status: "waiting",
    subject: input.subject ?? "New conversation",
    icon: input.icon,
    contact_name: input.contact_name,
    contact_email: input.contact_email,
    user_id: input.user_id,
    last_message_preview: input.initial_message?.slice(0, 120) ?? "",
    last_message_at: timestamp,
    created_at: timestamp,
    updated_at: timestamp,
  };

  const threads = [thread, ...state.threads];
  saveThreads(threads);

  if (input.initial_message) {
    sendMessage({
      thread_id: thread.id,
      sender_type: "user",
      sender_name: input.contact_name,
      body: input.initial_message,
      message_type: input.message_type ?? "general",
    });
  }

  return thread;
}

export function sendMessage(input: SendSupportMessageInput): SupportMessage {
  const state = getSupportState();
  const timestamp = nowIso();
  const message: SupportMessage = {
    id: createId("msg"),
    thread_id: input.thread_id,
    sender_type: input.sender_type,
    sender_name: input.sender_name,
    body: input.body,
    message_type: input.message_type ?? "general",
    created_at: timestamp,
    needs_escalation: input.needs_escalation,
  };

  const messages = [...state.messages, message];
  saveMessages(messages);

  const threads = state.threads.map((t) =>
    t.id === input.thread_id
      ? {
          ...t,
          last_message_preview: input.body.slice(0, 120),
          last_message_at: timestamp,
          updated_at: timestamp,
        }
      : t,
  );
  saveThreads(threads);

  return message;
}

const AI_RESPONSES: Record<string, string> = {
  payout:
    "Payouts typically arrive within 2–7 business days after a session completes. Check Finance → Payouts for the latest status. If it's been longer, I can transfer you to our finance team.",
  stripe:
    "To connect Stripe, go to Club Dashboard → Finance → Stripe Connect and complete verification. You'll need your business bank details and ID.",
  refund:
    "Refunds are processed back to the original payment method within 5–10 business days. Clubs can issue refunds from the booking detail page.",
  session:
    "Use the Session Wizard to create sessions with age range, capacity, and pricing. Draft sessions can be edited before publishing.",
  booking:
    "You can book sessions from search or your club's public page. To change a booking, check the club's cancellation policy in My Bookings.",
  onboarding:
    "Complete each onboarding step at your own pace — progress is saved automatically. Our team reviews new listings within 1–2 business days.",
};

const ESCALATION_TRIGGERS = [
  "speak to human",
  "talk to human",
  "real person",
  "transfer",
  "not helpful",
  "urgent",
  "complaint",
  "legal",
];

function matchAiResponse(body: string): { text: string; escalate: boolean } {
  const lower = body.toLowerCase();

  if (ESCALATION_TRIGGERS.some((t) => lower.includes(t))) {
    return {
      text: "I understand you'd like to speak with someone from our team.",
      escalate: true,
    };
  }

  for (const [keyword, response] of Object.entries(AI_RESPONSES)) {
    if (lower.includes(keyword)) {
      const shouldEscalate =
        lower.includes("still") ||
        lower.includes("not working") ||
        lower.includes("pending") ||
        lower.includes("help me");
      return { text: response, escalate: shouldEscalate };
    }
  }

  if (lower.length < 8) {
    return {
      text: "Could you tell me a bit more? I can help with payouts, Stripe, refunds, sessions, and bookings.",
      escalate: false,
    };
  }

  const uncertain = lower.includes("?") && Math.random() > 0.55;
  return {
    text: uncertain
      ? "I'm not fully confident about that specific situation."
      : "Thanks for reaching out. I've noted your message — our support articles may also help under the Help Centre tab.",
    escalate: uncertain,
  };
}

export function sendUserMessageAndMaybeAiReply(
  threadId: string,
  body: string,
  messageType: MessageType = "general",
): { userMessage: SupportMessage; aiMessage?: SupportMessage } {
  const thread = getThreadById(threadId);
  if (!thread) {
    throw new Error("Thread not found");
  }

  const contact = getCurrentUserContact();
  const userMessage = sendMessage({
    thread_id: threadId,
    sender_type: "user",
    sender_name: thread.contact_name || contact.name,
    body,
    message_type: messageType,
  });

  if (!canUseAi(thread.support_mode)) {
    return { userMessage };
  }

  const { text, escalate } = matchAiResponse(body);
  const aiMessage = sendMessage({
    thread_id: threadId,
    sender_type: "ai",
    sender_name: "Activora AI",
    body: text,
    message_type: messageType,
    needs_escalation: escalate,
  });

  return { userMessage, aiMessage };
}

export function escalateThreadToHuman(threadId: string): SupportThread | null {
  const state = getSupportState();
  const thread = state.threads.find((t) => t.id === threadId);
  if (!thread) {
    return null;
  }

  const timestamp = nowIso();
  const updated: SupportThread = {
    ...thread,
    support_mode: "human",
    status: "waiting",
    updated_at: timestamp,
  };

  saveThreads(
    state.threads.map((t) => (t.id === threadId ? updated : t)),
  );

  sendMessage({
    thread_id: threadId,
    sender_type: "system",
    sender_name: "System",
    body: "You've been transferred to our human support team. Chima or a team member will respond shortly.",
    message_type: "support",
  });

  return updated;
}

export function updateThreadStatus(
  threadId: string,
  status: ThreadStatus,
): void {
  const state = getSupportState();
  saveThreads(
    state.threads.map((t) =>
      t.id === threadId ? { ...t, status, updated_at: nowIso() } : t,
    ),
  );
}

export function assignThread(
  threadId: string,
  assigneeId: string,
  assigneeName: string,
): void {
  const state = getSupportState();
  const assignment: SupportAssignment = {
    id: createId("assign"),
    thread_id: threadId,
    assignee_id: assigneeId,
    assignee_name: assigneeName,
    assigned_at: nowIso(),
  };

  saveAssignments([
    ...state.assignments.filter((a) => a.thread_id !== threadId),
    assignment,
  ]);

  saveThreads(
    state.threads.map((t) =>
      t.id === threadId
        ? { ...t, status: "assigned" as ThreadStatus, updated_at: nowIso() }
        : t,
    ),
  );
}

export function renameThread(threadId: string, subject: string): void {
  const trimmed = subject.trim();
  if (!trimmed) {
    return;
  }
  const state = getSupportState();
  saveThreads(
    state.threads.map((t) =>
      t.id === threadId
        ? { ...t, subject: trimmed, updated_at: nowIso() }
        : t,
    ),
  );
}

export function archiveThread(threadId: string): void {
  const timestamp = nowIso();
  const state = getSupportState();
  saveThreads(
    state.threads.map((t) =>
      t.id === threadId
        ? {
            ...t,
            archived: true,
            archivedAt: timestamp,
            updated_at: timestamp,
          }
        : t,
    ),
  );
}

export function unarchiveThread(threadId: string): void {
  const state = getSupportState();
  saveThreads(
    state.threads.map((t) =>
      t.id === threadId
        ? {
            ...t,
            archived: false,
            archivedAt: undefined,
            updated_at: nowIso(),
          }
        : t,
    ),
  );
}

export function deleteThread(threadId: string): void {
  const timestamp = nowIso();
  const state = getSupportState();
  saveThreads(
    state.threads.map((t) =>
      t.id === threadId
        ? {
            ...t,
            deletedAt: timestamp,
            archived: false,
            archivedAt: undefined,
            updated_at: timestamp,
          }
        : t,
    ),
  );
}

export function restoreThread(threadId: string): void {
  const state = getSupportState();
  saveThreads(
    state.threads.map((t) =>
      t.id === threadId
        ? {
            ...t,
            deletedAt: undefined,
            updated_at: nowIso(),
          }
        : t,
    ),
  );
}

export function permanentlyDeleteThread(threadId: string): void {
  const state = getSupportState();
  saveThreads(state.threads.filter((t) => t.id !== threadId));
  saveMessages(state.messages.filter((m) => m.thread_id !== threadId));
  saveAssignments(
    state.assignments.filter((a) => a.thread_id !== threadId),
  );
}

export function bulkArchiveThreads(threadIds: string[]): void {
  for (const id of threadIds) {
    archiveThread(id);
  }
}

export function bulkDeleteThreads(threadIds: string[]): void {
  for (const id of threadIds) {
    deleteThread(id);
  }
}

export function searchThreads(query: string): SupportThread[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return getThreads();
  }
  return getThreads().filter(
    (t) =>
      t.subject.toLowerCase().includes(q) ||
      t.contact_name.toLowerCase().includes(q) ||
      t.last_message_preview.toLowerCase().includes(q),
  );
}

export const ADMIN_ASSIGNEES = [
  { id: "chima", name: "Chima" },
  { id: "team", name: "Team" },
] as const;
