import type { MessageTemplateRecord, TemplateKey } from "./types";

export const DEMO_PROVIDER_COUNT = 1284;

export const DEMO_PROVIDER_ID = "demo";

const now = "2026-06-01T00:00:00.000Z";

function platformTemplate(
  templateKey: TemplateKey,
  name: string,
  description: string,
  subject: string,
  body: string,
  sendDelay: MessageTemplateRecord["sendDelay"],
  enabled = true,
  channels: MessageTemplateRecord["channels"] = ["email"],
): MessageTemplateRecord {
  return {
    id: `platform-template-${templateKey.toLowerCase()}`,
    scope: "platform",
    providerId: null,
    templateKey,
    channel: channels[0] ?? "email",
    channels,
    name,
    description,
    subject,
    body,
    enabled,
    sendDelay,
    createdAt: now,
    updatedAt: now,
  };
}

export const PLATFORM_DEFAULT_TEMPLATES: MessageTemplateRecord[] = [
  platformTemplate(
    "A",
    "Booking Confirmation",
    "Sent when a parent successfully books onto an activity.",
    "Booking confirmed — {activity_name}",
    "Hi {parent_name},\n\nThank you for booking {child_name} onto {activity_name} with {club_name}.\n\nSession: {session_date} at {session_time}\nVenue: {venue_name}\nReference: {booking_reference}\n\nView your booking: {booking_link}\n\nWe look forward to seeing you!\n\n— {club_name}",
    "immediate",
  ),
  platformTemplate(
    "B",
    "Payment Confirmation",
    "Sent when a payment is successfully processed.",
    "Payment received — {amount_paid}",
    "Hi {parent_name},\n\nWe've received your payment of {amount_paid} for {child_name}'s booking on {activity_name}.\n\nBooking reference: {booking_reference}\n\nThank you for choosing {club_name}.",
    "immediate",
  ),
  platformTemplate(
    "C",
    "Booking Reminder",
    "Reminder sent before an upcoming session.",
    "Reminder: {activity_name} on {session_date}",
    "Hi {parent_name},\n\nJust a friendly reminder that {child_name} is booked for {activity_name} on {session_date} at {session_time} at {venue_name}.\n\nSee you soon!\n\n— {club_name}",
    "24h_before",
  ),
  platformTemplate(
    "D",
    "Cancellation",
    "Sent when a session or booking is cancelled.",
    "Session cancelled — {activity_name}",
    "Hi {parent_name},\n\nWe're sorry to let you know that {activity_name} on {session_date} has been cancelled.\n\n{club_name} will follow up with any refund or rescheduling details for {child_name}. If you have questions, contact us at {club_email}.",
    "immediate",
  ),
  platformTemplate(
    "E",
    "Refund Confirmation",
    "Sent when a full or partial refund is processed.",
    "Refund processed — {refund_amount}",
    "Hi {parent_name},\n\nWe've processed a refund of {refund_amount} for {child_name}'s booking ({booking_reference}) for {activity_name}.\n\nPlease allow 5–10 working days for the refund to appear on your statement.\n\n— {club_name}",
    "immediate",
  ),
  platformTemplate(
    "F",
    "Review Request",
    "Sent after the final session in a booking block.",
    "Share your experience with {club_name}",
    "Hi {parent_name},\n\nWe hope {child_name} enjoyed {activity_name}. Your feedback helps other families find great activities.\n\nPlease leave a verified review here: {review_link}\n\nThank you!\n\n— {club_name}",
    "after_final_session",
  ),
  platformTemplate(
    "G",
    "Birthday Message",
    "Sent when a child's birthday falls within an active booking block.",
    "Happy Birthday {child_name}! 🎂",
    "Happy Birthday {child_name}!\n\nEveryone at {club_name} hopes you have a brilliant {birthday_age}th birthday. We can't wait to celebrate with you at your next session!\n\n— The {club_name} team",
    "on_birthday",
  ),
  platformTemplate(
    "H",
    "Waitlist Space Available",
    "Sent when a space opens on a waitlisted activity.",
    "Good news — a space is available for {activity_name}",
    "Hi {parent_name},\n\nGreat news! A space has opened for {child_name} on {activity_name} ({session_date} at {session_time}).\n\nBook now before it's taken: {booking_link}\n\n— {club_name}",
    "on_waitlist_open",
  ),
  platformTemplate(
    "I",
    "Session Changed",
    "Sent when session time, date, or venue is updated.",
    "Session update — {activity_name}",
    "Hi {parent_name},\n\nPlease note that {child_name}'s session for {activity_name} has been updated.\n\nNew details:\nDate: {session_date}\nTime: {session_time}\nVenue: {venue_name}\n\nReference: {booking_reference}\n\n— {club_name}",
    "immediate",
  ),
  platformTemplate(
    "J",
    "Booking Failed",
    "Sent when a booking or payment attempt fails.",
    "Booking could not be completed",
    "Hi {parent_name},\n\nUnfortunately we couldn't complete the booking for {child_name} on {activity_name}. No payment has been taken.\n\nPlease try again: {booking_link}\n\nIf you need help, contact us at {club_email} or {club_phone}.\n\n— {club_name}",
    "immediate",
  ),
  platformTemplate(
    "K",
    "Camp Starts Tomorrow",
    "Reminder sent the day before a camp or multi-day programme begins.",
    "Camp starts tomorrow — {activity_name}",
    "Hi {parent_name},\n\n{child_name}'s camp starts tomorrow! Here are the details:\n\nActivity: {activity_name}\nDate: {session_date}\nTime: {session_time}\nVenue: {venue_name}\n\nWhat to bring: comfortable clothing, water bottle, and any items listed in your booking confirmation.\n\nSee you tomorrow!\n\n— {club_name}",
    "day_before_camp",
  ),
  platformTemplate(
    "L",
    "Attendance Missing",
    "Sent when a child is marked absent without prior notice.",
    "We missed {child_name} today",
    "Hi {parent_name},\n\nWe noticed {child_name} wasn't marked present at {activity_name} today ({session_date}).\n\nIf this was unexpected, please let us know everything is okay by replying to this email or calling {club_phone}.\n\n— {club_name}",
    "after_session",
    false,
  ),
  platformTemplate(
    "M",
    "Multi-child Booking Confirmation",
    "Sent when a parent books multiple children in one transaction.",
    "Bookings confirmed for your family",
    "Hi {parent_name},\n\nThank you for booking with {club_name}. We've confirmed places for your children on {activity_name}.\n\nSession: {session_date} at {session_time}\nVenue: {venue_name}\nReference: {booking_reference}\n\nView all bookings: {booking_link}\n\n— {club_name}",
    "immediate",
  ),
];

export const ONBOARDING_PRECONFIGURED_LABELS = [
  "Booking emails",
  "Payment receipts",
  "Reminders",
  "Refund emails",
  "Review requests",
] as const;
