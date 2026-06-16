export type MessageChannel = "email" | "sms" | "whatsapp";

export type TemplateCode = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";

export type SendTiming =
  | "immediate"
  | "24h_before"
  | "2h_before"
  | "morning_of"
  | "after_session"
  | "after_final_session"
  | "on_birthday"
  | "optional_after_session";

export type MessageTemplate = {
  id: string;
  code: TemplateCode;
  name: string;
  description: string;
  channel: MessageChannel;
  subject: string;
  body: string;
  enabled: boolean;
  sendTiming: SendTiming;
};

export type CommunicationsMetrics = {
  messagesSentThisMonth: number;
  scheduledMessages: number;
  birthdayMessagesDue: number;
  reviewRequestsSent: number;
  failedMessages: number;
  parentRepliesNeedingAttention: number;
};

export type ParentReplyStatus = "open" | "resolved" | "pending";

export type ParentReply = {
  id: string;
  parentName: string;
  childName: string;
  activity: string;
  lastMessage: string;
  lastMessageAt: string;
  status: ParentReplyStatus;
  assignedStaff: string;
  bookingId?: string;
  customerEmail?: string;
};

export type MessageLogEntry = {
  id: string;
  templateCode: TemplateCode;
  channel: MessageChannel;
  status: "sent" | "scheduled" | "failed";
  sentAt: string;
  parentEmail?: string;
};

export type MergeTagContext = {
  parent_name: string;
  child_name: string;
  club_name: string;
  activity_name: string;
  session_date: string;
  session_time: string;
  venue_name: string;
  booking_reference: string;
  review_link: string;
  birthday_age: string;
};

export const SEND_TIMING_LABELS: Record<SendTiming, string> = {
  immediate: "Immediately when triggered",
  "24h_before": "24 hours before session",
  "2h_before": "2 hours before session",
  morning_of: "Morning of session",
  after_session: "After session ends",
  after_final_session: "After final session in booking block",
  on_birthday: "On child's birthday",
  optional_after_session: "Optional — after session",
};

export const CHANNEL_LABELS: Record<MessageChannel, string> = {
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
};
