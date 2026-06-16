import type { MessageTemplate } from "./types";

export const COMMUNICATIONS_TEMPLATES_KEY = "activora-club-communications-templates";

export const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: "template-a",
    code: "A",
    name: "Booking confirmation",
    description: "Sent when a parent books onto an activity.",
    channel: "email",
    subject: "Booking confirmed — {activity_name}",
    body:
      "Hi {parent_name}, thanks for booking {child_name} onto {activity_name} with {club_name}. The session is on {session_date} at {session_time} at {venue_name}. Your booking reference is {booking_reference}.",
    enabled: true,
    sendTiming: "immediate",
  },
  {
    id: "template-b",
    code: "B",
    name: "Payment confirmation",
    description: "Sent when a payment is successful.",
    channel: "email",
    subject: "Payment received — {booking_reference}",
    body:
      "Hi {parent_name}, we've received your payment for {child_name}'s booking on {activity_name}. Your booking reference is {booking_reference}. Thank you for choosing {club_name}.",
    enabled: true,
    sendTiming: "immediate",
  },
  {
    id: "template-c",
    code: "C",
    name: "Booking reminder",
    description: "Reminder before the session — 24h, 2h, or morning of.",
    channel: "email",
    subject: "Reminder: {activity_name} on {session_date}",
    body:
      "Hi {parent_name}, just a reminder that {child_name} is booked for {activity_name} on {session_date} at {session_time} at {venue_name}. See you soon! — {club_name}",
    enabled: true,
    sendTiming: "24h_before",
  },
  {
    id: "template-d",
    code: "D",
    name: "Cancellation message",
    description: "Sent when a session is cancelled.",
    channel: "email",
    subject: "Session cancelled — {activity_name}",
    body:
      "Hi {parent_name}, we're sorry to let you know that {activity_name} on {session_date} has been cancelled. {club_name} will follow up with any refund or rescheduling details for {child_name}.",
    enabled: true,
    sendTiming: "immediate",
  },
  {
    id: "template-e",
    code: "E",
    name: "Refund confirmation",
    description: "Sent for full or partial refunds.",
    channel: "email",
    subject: "Refund processed — {booking_reference}",
    body:
      "Hi {parent_name}, we've processed a refund for {child_name}'s booking ({booking_reference}) for {activity_name}. If you have any questions, please contact {club_name}.",
    enabled: true,
    sendTiming: "immediate",
  },
  {
    id: "template-f",
    code: "F",
    name: "Register / attendance follow-up",
    description: "Optional message after a session.",
    channel: "email",
    subject: "Thanks for attending {activity_name}",
    body:
      "Hi {parent_name}, thank you for bringing {child_name} to {activity_name} today. We hope they enjoyed the session at {venue_name}. — {club_name}",
    enabled: false,
    sendTiming: "optional_after_session",
  },
  {
    id: "template-g",
    code: "G",
    name: "Review request",
    description: "Sent after the final session in a booking block.",
    channel: "email",
    subject: "Share your experience with {club_name}",
    body:
      "Hi {parent_name}, we hope {child_name} enjoyed {activity_name}. Please leave a verified review here: {review_link}.",
    enabled: true,
    sendTiming: "after_final_session",
  },
  {
    id: "template-h",
    code: "H",
    name: "Birthday message",
    description:
      "Sent when a child's birthday falls within an active booking block.",
    channel: "email",
    subject: "Happy Birthday {child_name}!",
    body:
      "Happy Birthday {child_name}! Everyone at {club_name} hopes you have a brilliant day.",
    enabled: true,
    sendTiming: "on_birthday",
  },
];
