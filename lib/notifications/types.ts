export type NotificationType =
  | "bookings"
  | "refunds"
  | "messages"
  | "reviews"
  | "payouts"
  | "system"
  | "waitlist";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  archived: boolean;
  createdAt: string;
};

export const NOTIFICATIONS_STORAGE_KEY = "activora-notifications";
