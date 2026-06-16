export type ChannelStatus = "live" | "setup_required" | "future";

export type SmsProvider = "twilio" | "messagebird" | "vonage";

export type WhatsAppProvider = "twilio" | "messagebird" | "vonage";

export type WhatsAppTemplateApprovalStatus =
  | "not_submitted"
  | "pending"
  | "approved";

export type AutomatedTemplateKey =
  | "booking_confirmation"
  | "session_reminder"
  | "review_request";

export type TemplateChannelToggle = {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
};

export type SmsChannelConfig = {
  connected: boolean;
  provider: SmsProvider | null;
  apiKey: string;
  senderName: string;
};

export type WhatsAppChannelConfig = {
  connected: boolean;
  businessNumber: string;
  provider: WhatsAppProvider | null;
  templateApprovalStatus: WhatsAppTemplateApprovalStatus;
};

export type DeliveryChannelsConfig = {
  sms: SmsChannelConfig;
  whatsapp: WhatsAppChannelConfig;
  templateChannels: Record<AutomatedTemplateKey, TemplateChannelToggle>;
};

export const DELIVERY_CHANNELS_STORAGE_KEY =
  "activora-club-delivery-channels";

export const PUSH_NOTIFICATIONS_INTEREST_KEY =
  "activora-club-push-notifications-interest";

export const SMS_PROVIDER_OPTIONS: Array<{
  value: SmsProvider;
  label: string;
}> = [
  { value: "twilio", label: "Twilio" },
  { value: "messagebird", label: "MessageBird" },
  { value: "vonage", label: "Vonage" },
];

export const WHATSAPP_PROVIDER_OPTIONS: Array<{
  value: WhatsAppProvider;
  label: string;
}> = [
  { value: "twilio", label: "Twilio" },
  { value: "messagebird", label: "MessageBird" },
  { value: "vonage", label: "Vonage" },
];

export const WHATSAPP_TEMPLATE_STATUS_OPTIONS: Array<{
  value: WhatsAppTemplateApprovalStatus;
  label: string;
}> = [
  { value: "not_submitted", label: "Not submitted" },
  { value: "pending", label: "Pending approval" },
  { value: "approved", label: "Approved" },
];

export const AUTOMATED_TEMPLATE_LABELS: Record<
  AutomatedTemplateKey,
  { name: string; description: string }
> = {
  booking_confirmation: {
    name: "Booking confirmation",
    description: "Sent when a parent completes a booking.",
  },
  session_reminder: {
    name: "Session reminder",
    description: "Reminder before the session starts.",
  },
  review_request: {
    name: "Review request",
    description: "Sent after attendance to collect verified reviews.",
  },
};

const DEFAULT_TEMPLATE_CHANNELS: Record<
  AutomatedTemplateKey,
  TemplateChannelToggle
> = {
  booking_confirmation: { email: true, sms: false, whatsapp: false },
  session_reminder: { email: true, sms: false, whatsapp: false },
  review_request: { email: true, sms: false, whatsapp: false },
};

export const DEFAULT_DELIVERY_CHANNELS_CONFIG: DeliveryChannelsConfig = {
  sms: {
    connected: false,
    provider: null,
    apiKey: "",
    senderName: "",
  },
  whatsapp: {
    connected: false,
    businessNumber: "",
    provider: null,
    templateApprovalStatus: "not_submitted",
  },
  templateChannels: DEFAULT_TEMPLATE_CHANNELS,
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function mergeWithDefaults(
  partial: Partial<DeliveryChannelsConfig>,
): DeliveryChannelsConfig {
  return {
    sms: {
      ...DEFAULT_DELIVERY_CHANNELS_CONFIG.sms,
      ...partial.sms,
    },
    whatsapp: {
      ...DEFAULT_DELIVERY_CHANNELS_CONFIG.whatsapp,
      ...partial.whatsapp,
    },
    templateChannels: {
      ...DEFAULT_TEMPLATE_CHANNELS,
      ...partial.templateChannels,
      booking_confirmation: {
        ...DEFAULT_TEMPLATE_CHANNELS.booking_confirmation,
        ...partial.templateChannels?.booking_confirmation,
        email: true,
      },
      session_reminder: {
        ...DEFAULT_TEMPLATE_CHANNELS.session_reminder,
        ...partial.templateChannels?.session_reminder,
        email: true,
      },
      review_request: {
        ...DEFAULT_TEMPLATE_CHANNELS.review_request,
        ...partial.templateChannels?.review_request,
        email: true,
      },
    },
  };
}

export function getDeliveryChannelsConfig(): DeliveryChannelsConfig {
  if (!isBrowser()) {
    return { ...DEFAULT_DELIVERY_CHANNELS_CONFIG };
  }

  try {
    const raw = localStorage.getItem(DELIVERY_CHANNELS_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_DELIVERY_CHANNELS_CONFIG };
    }

    return mergeWithDefaults(JSON.parse(raw) as Partial<DeliveryChannelsConfig>);
  } catch {
    return { ...DEFAULT_DELIVERY_CHANNELS_CONFIG };
  }
}

export function saveDeliveryChannelsConfig(
  config: DeliveryChannelsConfig,
): DeliveryChannelsConfig {
  const normalized = mergeWithDefaults(config);

  if (isBrowser()) {
    try {
      localStorage.setItem(
        DELIVERY_CHANNELS_STORAGE_KEY,
        JSON.stringify(normalized),
      );
    } catch {
      // ignore storage errors in stub
    }
  }

  return normalized;
}

export function getSmsProviderLabel(provider: SmsProvider | null): string {
  if (!provider) {
    return "Not selected";
  }

  return (
    SMS_PROVIDER_OPTIONS.find((option) => option.value === provider)?.label ??
    provider
  );
}

export function getWhatsAppProviderLabel(
  provider: WhatsAppProvider | null,
): string {
  if (!provider) {
    return "Not selected";
  }

  return (
    WHATSAPP_PROVIDER_OPTIONS.find((option) => option.value === provider)
      ?.label ?? provider
  );
}

export function getWhatsAppTemplateStatusLabel(
  status: WhatsAppTemplateApprovalStatus,
): string {
  return (
    WHATSAPP_TEMPLATE_STATUS_OPTIONS.find((option) => option.value === status)
      ?.label ?? status
  );
}

export function getPushNotificationsInterest(): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    return localStorage.getItem(PUSH_NOTIFICATIONS_INTEREST_KEY) === "true";
  } catch {
    return false;
  }
}

export function savePushNotificationsInterest(): void {
  if (!isBrowser()) {
    return;
  }

  try {
    localStorage.setItem(PUSH_NOTIFICATIONS_INTEREST_KEY, "true");
  } catch {
    // ignore storage errors in stub
  }
}

export type PushFeatureDefinition = {
  id: string;
  title: string;
  notifications: readonly string[];
  exampleTiming: readonly string[];
  benefits: readonly string[];
};

export const PUSH_FEATURE_DEFINITIONS: readonly PushFeatureDefinition[] = [
  {
    id: "mobile",
    title: "Parent mobile app notifications",
    notifications: [
      "Booking confirmed",
      "Session reminder",
      "Session cancelled",
      "Review reminder",
    ],
    exampleTiming: [
      "Instant on booking confirmation",
      "24 h and 1 h before session",
      "Immediately on cancellation",
    ],
    benefits: [
      "Highest open rates for time-sensitive updates",
      "Badge counts keep parents informed at a glance",
      "Works even when email is buried",
    ],
  },
  {
    id: "browser",
    title: "Browser notifications",
    notifications: ["New message", "Booking updates", "Payment updates"],
    exampleTiming: [
      "Real-time on new club messages",
      "Within minutes of schedule changes",
      "When payment status changes",
    ],
    benefits: [
      "No app install required for club admins",
      "Desktop alerts while managing sessions",
      "Complements email for urgent updates",
    ],
  },
] as const;

export type PushStrategyDefinition = {
  id: string;
  emoji: string;
  label: string;
  examples: readonly string[];
  recommendation: string;
};

export const PUSH_STRATEGY_DEFINITIONS: readonly PushStrategyDefinition[] = [
  {
    id: "urgent",
    emoji: "🚨",
    label: "Urgent",
    examples: ["Booking cancelled", "Schedule change"],
    recommendation: "Push + Email",
  },
  {
    id: "reminder",
    emoji: "⏰",
    label: "Reminder",
    examples: ["Session tomorrow", "Review reminder"],
    recommendation: "Push",
  },
  {
    id: "marketing",
    emoji: "📣",
    label: "Marketing",
    examples: ["New club launch", "Discount offer"],
    recommendation: "Email",
  },
] as const;

export const PUSH_FUTURE_PROVIDERS = [
  "Firebase Cloud Messaging",
  "Apple Push Notifications",
  "Web Push",
  "Android notifications",
] as const;

export const PUSH_ROLLOUT = {
  phase: "Phase 3",
  estimate: "After parent app launch",
} as const;
