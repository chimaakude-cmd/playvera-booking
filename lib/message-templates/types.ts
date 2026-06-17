/**
 * Platform message templates (Activora).
 *
 * Storage (today): localStorage keys in storage.ts
 * Database: message_templates + provider_template_settings (see migration stub)
 */

export type MessageTemplateScope = "platform" | "provider";

export type TemplateKey =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L"
  | "M";

export type MessageChannel = "email" | "sms" | "whatsapp";

export type SendTiming =
  | "immediate"
  | "24h_before"
  | "2h_before"
  | "morning_of"
  | "after_session"
  | "after_final_session"
  | "on_birthday"
  | "optional_after_session"
  | "1h_before"
  | "evening_before"
  | "on_waitlist_open"
  | "day_before_camp";

export type MessageTemplateRecord = {
  id: string;
  scope: MessageTemplateScope;
  providerId: string | null;
  templateKey: TemplateKey;
  /** Primary channel — mirrors DB `channel` column */
  channel: MessageChannel;
  /** UI layer — all enabled delivery channels for this template */
  channels: MessageChannel[];
  name: string;
  description: string;
  subject: string;
  body: string;
  enabled: boolean;
  sendDelay: SendTiming;
  createdAt: string;
  updatedAt: string;
};

export type ProviderTemplateSettings = {
  providerId: string;
  templateKey: TemplateKey;
  usesDefault: boolean;
};

export type BulkApplyScope = "all_providers" | "new_providers_only" | "selected_providers";

export type BulkApplyOptions = {
  scope: BulkApplyScope;
  selectedProviderIds?: string[];
};

export type VariableCategory = "parent" | "child" | "club" | "booking" | "finance";

export type TemplateVariable = {
  tag: string;
  label: string;
  category: VariableCategory;
  sampleValue: string;
};

export type MergeTagContext = Record<string, string>;

export const SEND_TIMING_LABELS: Record<SendTiming, string> = {
  immediate: "Immediately when triggered",
  "24h_before": "24 hours before session",
  "2h_before": "2 hours before session",
  "1h_before": "1 hour before session",
  morning_of: "Morning of session",
  evening_before: "Evening before session",
  after_session: "After session ends",
  after_final_session: "After final session in booking block",
  on_birthday: "On child's birthday",
  optional_after_session: "Optional — after session",
  on_waitlist_open: "When a waitlist space opens",
  day_before_camp: "Day before camp starts",
};

export const CHANNEL_LABELS: Record<MessageChannel, string> = {
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
};

export const VARIABLE_CATEGORY_LABELS: Record<VariableCategory, string> = {
  parent: "Parent",
  child: "Child",
  club: "Club",
  booking: "Booking",
  finance: "Finance",
};

export const TEMPLATE_KEY_ORDER: TemplateKey[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
];
