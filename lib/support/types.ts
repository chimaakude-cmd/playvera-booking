/**
 * Activora Support Centre types.
 *
 * Storage (today): localStorage `activora-support-threads`, `activora-support-messages`
 * Database: supabase/migrations/00024_support_centre.sql
 */

export type SupportMode = "ai" | "human" | "hybrid";

export type SupportContext =
  | "public"
  | "parent"
  | "club_onboarding"
  | "club_signed_in"
  | "admin";

export type MessageType =
  | "support"
  | "payments"
  | "bookings"
  | "technical"
  | "general";

export type ThreadStatus =
  | "open"
  | "waiting"
  | "assigned"
  | "resolved"
  | "closed";

export type SenderType = "user" | "ai" | "human" | "system";

export type SupportThread = {
  id: string;
  context: SupportContext;
  support_mode: SupportMode;
  message_type: MessageType;
  status: ThreadStatus;
  subject: string;
  icon?: string;
  contact_name: string;
  contact_email: string;
  user_id?: string;
  last_message_preview: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  archived?: boolean;
  archivedAt?: string;
  deletedAt?: string;
};

export type SupportMessage = {
  id: string;
  thread_id: string;
  sender_type: SenderType;
  sender_name: string;
  body: string;
  message_type: MessageType;
  created_at: string;
  needs_escalation?: boolean;
};

export type SupportAssignment = {
  id: string;
  thread_id: string;
  assignee_id: string;
  assignee_name: string;
  assigned_at: string;
};

export type SupportState = {
  threads: SupportThread[];
  messages: SupportMessage[];
  assignments: SupportAssignment[];
};

export type CreateThreadInput = {
  context: SupportContext;
  support_mode: SupportMode;
  message_type?: MessageType;
  subject?: string;
  contact_name: string;
  contact_email: string;
  user_id?: string;
  initial_message?: string;
  icon?: string;
};

export type SendSupportMessageInput = {
  thread_id: string;
  sender_type: SenderType;
  sender_name: string;
  body: string;
  message_type?: MessageType;
  needs_escalation?: boolean;
};
