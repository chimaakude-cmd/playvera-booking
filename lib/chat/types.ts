/**
 * Activora chat / helpdesk types.
 *
 * Storage (today): localStorage `activora-chat`
 * Database: supabase/migrations/00015_chat_system.sql
 */

export type ConversationType = "public" | "parent" | "provider";

export type ConversationStatus =
  | "open"
  | "pending"
  | "resolved"
  | "closed";

export type ConversationPriority = "low" | "normal" | "high" | "urgent";

export type SenderType = "visitor" | "parent" | "provider" | "admin" | "system";

export type HandledBy = "human" | "ai" | "hybrid";

export type ChatUserType = "visitor" | "parent" | "provider";

export type Conversation = {
  id: string;
  type: ConversationType;
  status: ConversationStatus;
  priority: ConversationPriority;
  handledBy: HandledBy;
  aiAssistantEnabled: boolean;
  contactName: string;
  contactEmail: string;
  userType: ChatUserType;
  providerId?: string;
  providerName?: string;
  bookingId?: string;
  bookingReference?: string;
  assignedAdminId?: string;
  assignedAdminName?: string;
  subject: string;
  lastMessagePreview: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderType: SenderType;
  senderName: string;
  body: string;
  createdAt: string;
};

export type InternalNote = {
  id: string;
  conversationId: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type ConversationAssignment = {
  id: string;
  conversationId: string;
  adminId: string;
  adminName: string;
  assignedAt: string;
};

export type ChatState = {
  conversations: Conversation[];
  messages: Message[];
  internalNotes: InternalNote[];
  assignments: ConversationAssignment[];
};

export type CreatePublicEnquiryInput = {
  name: string;
  email: string;
  message: string;
};

export type CreateUserConversationInput = {
  type: "parent" | "provider";
  contactName: string;
  contactEmail: string;
  providerId?: string;
  providerName?: string;
  message: string;
};

export type SendMessageInput = {
  conversationId: string;
  senderType: SenderType;
  senderName: string;
  body: string;
};
