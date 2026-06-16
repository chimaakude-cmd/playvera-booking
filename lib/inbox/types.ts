/**
 * Unified club inbox types — messages, notifications, reviews, bookings, payments, system.
 *
 * Storage (today): localStorage `activora-club-inbox`
 */

export type InboxCategory =
  | "all"
  | "messages"
  | "notifications"
  | "reviews"
  | "bookings"
  | "payments"
  | "system";

export type InboxItemType =
  | "message"
  | "notification"
  | "review"
  | "booking"
  | "payment"
  | "system";

export type InboxPriority = "normal" | "high";

export type InboxItemStatus = "unread" | "read" | "archived";

export type BookingInboxSubtype =
  | "booking_created"
  | "booking_cancelled"
  | "session_reminder";

export type PaymentInboxSubtype =
  | "payout_completed"
  | "refund_requested"
  | "stripe_update"
  | "payment_received";

export type ReviewInboxSubtype = "parent_rating";

export type NotificationInboxSubtype = "platform_update";

export type SystemInboxSubtype =
  | "account_alert"
  | "onboarding_reminder"
  | "subscription_notice";

export type InboxSubtype =
  | BookingInboxSubtype
  | PaymentInboxSubtype
  | ReviewInboxSubtype
  | NotificationInboxSubtype
  | SystemInboxSubtype;

export type InboxItem = {
  id: string;
  type: InboxItemType;
  category: Exclude<InboxCategory, "all">;
  title: string;
  preview: string;
  timestamp: string;
  status: InboxItemStatus;
  priority: InboxPriority;
  /** Support thread id for message items */
  threadId?: string;
  bookingId?: string;
  paymentId?: string;
  reviewId?: string;
  href?: string;
  subtype?: InboxSubtype;
  body?: string;
  metadata?: Record<string, string | number | boolean>;
};

export type InboxFilterOptions = {
  category?: InboxCategory;
  status?: InboxItemStatus | "all";
  priority?: InboxPriority | "all";
  query?: string;
  highPriorityOnly?: boolean;
  unreadOnly?: boolean;
  archivedOnly?: boolean;
};

export type InboxUnreadCounts = Record<InboxCategory, number>;
