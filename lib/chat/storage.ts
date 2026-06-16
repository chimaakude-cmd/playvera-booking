import { MOCK_CHAT_STATE } from "./mock-data";
import type {
  ChatState,
  Conversation,
  ConversationStatus,
  CreatePublicEnquiryInput,
  CreateUserConversationInput,
  HandledBy,
  InternalNote,
  Message,
  SendMessageInput,
} from "./types";

export const CHAT_STORAGE_KEY = "activora-chat";
export const PARENT_SESSION_KEY = "activora-parent-session";
export const CLUB_SESSION_KEY = "activora-club-session";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function getDefaultState(): ChatState {
  return structuredClone(MOCK_CHAT_STATE);
}

export function getChatState(): ChatState {
  if (!isBrowser()) {
    return getDefaultState();
  }

  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) {
      const initial = getDefaultState();
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as ChatState;
  } catch {
    return getDefaultState();
  }
}

function saveChatState(state: ChatState): void {
  if (!isBrowser()) {
    return;
  }
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(state));
}

export function getConversations(): Conversation[] {
  return getChatState().conversations.sort(
    (a, b) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
  );
}

export function getConversationById(id: string): Conversation | undefined {
  return getChatState().conversations.find((c) => c.id === id);
}

export function getMessagesForConversation(conversationId: string): Message[] {
  return getChatState()
    .messages.filter((m) => m.conversationId === conversationId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
}

export function getInternalNotesForConversation(
  conversationId: string,
): InternalNote[] {
  return getChatState()
    .internalNotes.filter((n) => n.conversationId === conversationId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
}

export function createPublicEnquiry(
  input: CreatePublicEnquiryInput,
): Conversation {
  const state = getChatState();
  const timestamp = nowIso();
  const conversation: Conversation = {
    id: createId("conv"),
    type: "public",
    status: "open",
    priority: "normal",
    handledBy: "human",
    aiAssistantEnabled: false,
    contactName: input.name.trim(),
    contactEmail: input.email.trim(),
    userType: "visitor",
    subject: input.message.trim().slice(0, 80),
    lastMessagePreview: input.message.trim().slice(0, 120),
    lastMessageAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const message: Message = {
    id: createId("msg"),
    conversationId: conversation.id,
    senderType: "visitor",
    senderName: input.name.trim(),
    body: input.message.trim(),
    createdAt: timestamp,
  };

  state.conversations.unshift(conversation);
  state.messages.push(message);
  saveChatState(state);
  return conversation;
}

export function createUserConversation(
  input: CreateUserConversationInput,
): Conversation {
  const state = getChatState();
  const timestamp = nowIso();
  const conversation: Conversation = {
    id: createId("conv"),
    type: input.type,
    status: "open",
    priority: "normal",
    handledBy: "human",
    aiAssistantEnabled: false,
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    userType: input.type,
    providerId: input.providerId,
    providerName: input.providerName,
    subject: input.message.trim().slice(0, 80),
    lastMessagePreview: input.message.trim().slice(0, 120),
    lastMessageAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const message: Message = {
    id: createId("msg"),
    conversationId: conversation.id,
    senderType: input.type,
    senderName: input.contactName,
    body: input.message.trim(),
    createdAt: timestamp,
  };

  state.conversations.unshift(conversation);
  state.messages.push(message);
  saveChatState(state);
  return conversation;
}

export function sendMessage(input: SendMessageInput): Message {
  const state = getChatState();
  const timestamp = nowIso();
  const message: Message = {
    id: createId("msg"),
    conversationId: input.conversationId,
    senderType: input.senderType,
    senderName: input.senderName,
    body: input.body.trim(),
    createdAt: timestamp,
  };

  state.messages.push(message);
  const conversation = state.conversations.find(
    (c) => c.id === input.conversationId,
  );
  if (conversation) {
    conversation.lastMessagePreview = input.body.trim().slice(0, 120);
    conversation.lastMessageAt = timestamp;
    conversation.updatedAt = timestamp;
  }

  saveChatState(state);
  return message;
}

export function updateConversationStatus(
  conversationId: string,
  status: ConversationStatus,
): Conversation | undefined {
  const state = getChatState();
  const conversation = state.conversations.find((c) => c.id === conversationId);
  if (!conversation) {
    return undefined;
  }

  conversation.status = status;
  conversation.updatedAt = nowIso();
  saveChatState(state);
  return conversation;
}

export function assignConversation(
  conversationId: string,
  adminId: string,
  adminName: string,
): Conversation | undefined {
  const state = getChatState();
  const conversation = state.conversations.find((c) => c.id === conversationId);
  if (!conversation) {
    return undefined;
  }

  conversation.assignedAdminId = adminId;
  conversation.assignedAdminName = adminName;
  conversation.updatedAt = nowIso();
  state.assignments.push({
    id: createId("asgn"),
    conversationId,
    adminId,
    adminName,
    assignedAt: nowIso(),
  });
  saveChatState(state);
  return conversation;
}

export function addInternalNote(
  conversationId: string,
  authorName: string,
  body: string,
): InternalNote {
  const state = getChatState();
  const note: InternalNote = {
    id: createId("note"),
    conversationId,
    authorName,
    body: body.trim(),
    createdAt: nowIso(),
  };
  state.internalNotes.push(note);
  saveChatState(state);
  return note;
}

export function updateConversationHandledBy(
  conversationId: string,
  handledBy: HandledBy,
): Conversation | undefined {
  const state = getChatState();
  const conversation = state.conversations.find((c) => c.id === conversationId);
  if (!conversation) {
    return undefined;
  }

  conversation.handledBy = handledBy;
  conversation.updatedAt = nowIso();
  saveChatState(state);
  return conversation;
}

export type ChatWidgetUser = {
  kind: "visitor" | "parent" | "provider";
  name: string;
  email: string;
  providerId?: string;
  providerName?: string;
};

export function detectChatWidgetUser(): ChatWidgetUser {
  if (!isBrowser()) {
    return { kind: "visitor", name: "", email: "" };
  }

  try {
    const clubRaw = localStorage.getItem(CLUB_SESSION_KEY);
    if (clubRaw) {
      const club = JSON.parse(clubRaw) as {
        name?: string;
        email?: string;
        providerId?: string;
        clubName?: string;
      };
      if (club.email) {
        return {
          kind: "provider",
          name: club.name ?? "Club user",
          email: club.email,
          providerId: club.providerId,
          providerName: club.clubName,
        };
      }
    }
  } catch {
    // fall through
  }

  try {
    const parentRaw = localStorage.getItem(PARENT_SESSION_KEY);
    if (parentRaw) {
      const parent = JSON.parse(parentRaw) as { name?: string; email?: string };
      if (parent.email) {
        return {
          kind: "parent",
          name: parent.name ?? "Parent",
          email: parent.email,
        };
      }
    }
  } catch {
    // fall through
  }

  try {
    const profileRaw = localStorage.getItem("activora-parent-profile");
    if (profileRaw) {
      const profile = JSON.parse(profileRaw) as {
        fullName?: string;
        email?: string;
      };
      if (profile.email?.trim()) {
        return {
          kind: "parent",
          name: profile.fullName?.trim() || "Parent",
          email: profile.email.trim(),
        };
      }
    }
  } catch {
    // fall through
  }

  return { kind: "visitor", name: "", email: "" };
}
