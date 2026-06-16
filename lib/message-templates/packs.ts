import {
  getClubTemplateOverrides,
  getPlatformTemplates,
  getProviderId,
  saveClubTemplateOverride,
} from "./storage";
import { PLATFORM_DEFAULT_TEMPLATES } from "./defaults";
import type { MessageChannel, MessageTemplateRecord, SendTiming, TemplateKey } from "./types";
import { TEMPLATE_KEY_ORDER } from "./types";

export type PackCategory =
  | "BOOKING"
  | "PAYMENTS"
  | "REMINDERS"
  | "MARKETING"
  | "SUPPORT"
  | "REVIEWS"
  | "CAMPS"
  | "EMERGENCY";

export const PACK_CATEGORY_LABELS: Record<PackCategory, string> = {
  BOOKING: "Booking",
  PAYMENTS: "Payments",
  REMINDERS: "Reminders",
  MARKETING: "Marketing",
  SUPPORT: "Support",
  REVIEWS: "Reviews",
  CAMPS: "Camps",
  EMERGENCY: "Emergency",
};

export type PackTemplateDefinition = {
  id: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  sendDelay: SendTiming;
  categories: PackCategory[];
  channels?: MessageChannel[];
  /** Maps to platform template key A–M when installing */
  platformKey?: TemplateKey;
};

export type PackFeaturedExample = {
  label: string;
  subject: string;
  body: string;
};

export type TemplatePackDefinition = {
  id: string;
  name: string;
  description: string;
  sports?: string[];
  tone: string;
  categories: PackCategory[];
  templates: PackTemplateDefinition[];
  isDefault?: boolean;
  isAutoInstalled?: boolean;
  featuredExample?: PackFeaturedExample;
};

export type ClubCustomPackTemplate = {
  id: string;
  providerId: string;
  packId: string;
  packTemplateId: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  enabled: boolean;
  sendDelay: SendTiming;
  channel: MessageChannel;
  channels: MessageChannel[];
  categories: PackCategory[];
  createdAt: string;
  updatedAt: string;
};

export type InstallPackResult =
  | { success: true; templatesActive: number; packName: string }
  | { success: false; error: string };

export type ExportedClubTemplates = {
  version: 1;
  exportedAt: string;
  providerId: string;
  packId?: string;
  packName?: string;
  overrides: MessageTemplateRecord[];
  customTemplates: ClubCustomPackTemplate[];
};

const INSTALLED_PACKS_KEY = "activora-club-installed-packs";
const CUSTOM_PACK_TEMPLATES_KEY = "activora-club-custom-pack-templates";
const ORG_DEFAULT_PACK_KEY = "activora-club-org-default-pack";
const CUSTOM_PACKS_KEY = "activora-club-custom-pack-definitions";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function nowIso(): string {
  return new Date().toISOString();
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (!isBrowser()) {
    return;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

function packTemplate(
  id: string,
  name: string,
  description: string,
  subject: string,
  body: string,
  sendDelay: SendTiming,
  categories: PackCategory[],
  platformKey?: TemplateKey,
): PackTemplateDefinition {
  return {
    id,
    name,
    description,
    subject,
    body,
    sendDelay,
    categories,
    channels: ["email"],
    platformKey,
  };
}

export const TEMPLATE_PACKS: TemplatePackDefinition[] = [
  {
    id: "general-sports-club",
    name: "General Sports Club",
    description:
      "Professional, friendly templates for football, basketball, rugby, tennis, and mixed sports clubs.",
    sports: ["Football", "Basketball", "Rugby", "Tennis"],
    tone: "Professional + friendly",
    categories: ["BOOKING", "PAYMENTS", "REMINDERS", "REVIEWS", "SUPPORT"],
    isDefault: true,
    templates: [
      packTemplate(
        "booking-confirmation",
        "Booking Confirmation",
        "Sent when a parent successfully books onto an activity.",
        "You're booked — {activity_name}",
        "Hi {parent_name},\n\nGreat news — {child_name} is confirmed for {activity_name} with {club_name}.\n\nSession: {session_date} at {session_time}\nVenue: {venue_name}\nReference: {booking_reference}\n\nView your booking: {booking_link}\n\nWe look forward to seeing you on the pitch!\n\n— The {club_name} team",
        "immediate",
        ["BOOKING"],
        "A",
      ),
      packTemplate(
        "payment-confirmation",
        "Payment Confirmation",
        "Sent when a payment is successfully processed.",
        "Payment received — thank you",
        "Hi {parent_name},\n\nWe've received your payment of {amount_paid} for {child_name}'s place on {activity_name}.\n\nBooking reference: {booking_reference}\n\nThank you for choosing {club_name} — see you soon!\n\n— {club_name}",
        "immediate",
        ["PAYMENTS"],
        "B",
      ),
      packTemplate(
        "session-reminder",
        "Session Reminder",
        "Friendly reminder before an upcoming session.",
        "See you soon — {activity_name} on {session_date}",
        "Hi {parent_name},\n\nJust a quick reminder that {child_name} is booked for {activity_name} on {session_date} at {session_time} at {venue_name}.\n\nPlease arrive 5 minutes early. Don't forget water and appropriate kit!\n\n— {club_name}",
        "24h_before",
        ["REMINDERS"],
        "C",
      ),
      packTemplate(
        "cancellation",
        "Cancellation",
        "Sent when a session or booking is cancelled.",
        "Session cancelled — {activity_name}",
        "Hi {parent_name},\n\nWe're sorry to let you know that {activity_name} on {session_date} has been cancelled.\n\n{club_name} will follow up with any refund or rescheduling details for {child_name}. Questions? Contact us at {club_email}.\n\n— {club_name}",
        "immediate",
        ["SUPPORT", "BOOKING"],
        "D",
      ),
      packTemplate(
        "refund",
        "Refund Confirmation",
        "Sent when a refund is processed.",
        "Refund processed — {refund_amount}",
        "Hi {parent_name},\n\nWe've processed a refund of {refund_amount} for {child_name}'s booking ({booking_reference}) on {activity_name}.\n\nPlease allow 5–10 working days for the refund to appear on your statement.\n\n— {club_name}",
        "immediate",
        ["PAYMENTS"],
        "E",
      ),
      packTemplate(
        "review-request",
        "Review Request",
        "Sent after the final session in a booking block.",
        "How did {child_name} enjoy {activity_name}?",
        "Hi {parent_name},\n\nWe hope {child_name} had a brilliant time at {activity_name}. Your feedback helps other families discover great clubs like ours.\n\nLeave a verified review: {review_link}\n\nThank you!\n\n— {club_name}",
        "after_final_session",
        ["REVIEWS"],
        "F",
      ),
      packTemplate(
        "waitlist-open",
        "Waitlist Space Available",
        "Sent when a space opens on a waitlisted activity.",
        "A space just opened — {activity_name}",
        "Hi {parent_name},\n\nGreat news! A space has opened for {child_name} on {activity_name} ({session_date} at {session_time}).\n\nBook now before it's taken: {booking_link}\n\n— {club_name}",
        "on_waitlist_open",
        ["BOOKING"],
        "H",
      ),
      packTemplate(
        "birthday",
        "Birthday Message",
        "Sent on a child's birthday during an active booking block.",
        "Happy Birthday {child_name}! 🎂",
        "Happy Birthday {child_name}!\n\nEveryone at {club_name} hopes you have an amazing {birthday_age}th birthday. We can't wait to celebrate with you at your next session!\n\n— The {club_name} team",
        "on_birthday",
        ["MARKETING"],
        "G",
      ),
    ],
  },
  {
    id: "after-school-clubs",
    name: "After School Clubs",
    description:
      "Reassuring, parent-focused messaging for wraparound care and after-school programmes.",
    tone: "Parent reassurance",
    categories: ["REMINDERS", "SUPPORT", "BOOKING"],
    featuredExample: {
      label: "Club starts tomorrow",
      subject: "Tomorrow — {child_name}'s after-school club",
      body: "Hi {parent_name},\n\nA friendly reminder that {child_name}'s after-school club starts tomorrow.\n\nActivity: {activity_name}\nTime: {session_time}\nVenue: {venue_name}\n\nCollection is at the main reception. If your collection arrangements change, please let us know in advance.\n\nWe're looking forward to a great term!\n\n— {club_name}",
    },
    templates: [
      packTemplate(
        "collection-reminder",
        "Collection Reminder",
        "Reminder about pick-up time and location.",
        "Collection reminder — {activity_name} today",
        "Hi {parent_name},\n\nJust a reminder that {child_name} finishes {activity_name} today at {session_time}.\n\nCollection point: {venue_name} main reception.\n\nIf someone else is collecting, please reply to confirm their name.\n\n— {club_name}",
        "1h_before",
        ["REMINDERS"],
      ),
      packTemplate(
        "club-starts-today",
        "Club Starts Today",
        "Morning-of reminder for after-school club.",
        "Today — {child_name}'s after-school club",
        "Hi {parent_name},\n\n{child_name}'s after-school club is on today!\n\nActivity: {activity_name}\nTime: {session_time}\nVenue: {venue_name}\n\nPlease ensure they have a snack and any required kit. We'll take good care of them.\n\n— {club_name}",
        "morning_of",
        ["REMINDERS"],
      ),
      packTemplate(
        "late-collection-alert",
        "Late Collection Alert",
        "Sent when a child has not been collected on time.",
        "Late collection — {child_name} waiting at {club_name}",
        "Hi {parent_name},\n\n{child_name} is still with us at {venue_name} following {activity_name}. Our collection window has passed.\n\nPlease collect as soon as possible or call us on {club_phone}.\n\nLate collection fees may apply as per our club policy.\n\n— {club_name}",
        "immediate",
        ["EMERGENCY", "SUPPORT"],
      ),
      packTemplate(
        "behaviour-update",
        "Behaviour Update",
        "Neutral update about a child's session behaviour.",
        "Update from today's session — {child_name}",
        "Hi {parent_name},\n\nWe wanted to share a brief update about {child_name}'s session at {activity_name} today.\n\nOur team will follow up if any further conversation would be helpful. Please feel free to reply or call {club_phone}.\n\n— {club_name}",
        "after_session",
        ["SUPPORT"],
      ),
      packTemplate(
        "end-of-term-thank-you",
        "End of Term Thank You",
        "Warm thank-you at the end of a term block.",
        "Thank you for a wonderful term",
        "Hi {parent_name},\n\nAs this term comes to a close, we wanted to thank you for trusting {club_name} with {child_name}'s after-school care.\n\nWe hope they enjoyed {activity_name} and we look forward to welcoming them back next term.\n\nBookings for next term: {club_website}\n\n— The {club_name} team",
        "after_final_session",
        ["MARKETING"],
      ),
      packTemplate(
        "booking-confirmation",
        "Booking Confirmation",
        "Reassuring booking confirmation for after-school places.",
        "Place confirmed — {activity_name}",
        "Hi {parent_name},\n\nWe're pleased to confirm {child_name}'s place on {activity_name} with {club_name}.\n\nSession: {session_date} at {session_time}\nVenue: {venue_name}\nReference: {booking_reference}\n\nOur team will supervise collection and handover. View details: {booking_link}\n\n— {club_name}",
        "immediate",
        ["BOOKING"],
        "A",
      ),
      packTemplate(
        "session-reminder",
        "Tomorrow Reminder",
        "Evening-before reminder with collection details.",
        "Tomorrow — {child_name}'s after-school club",
        "Hi {parent_name},\n\nA friendly reminder that {child_name}'s after-school club starts tomorrow.\n\nActivity: {activity_name}\nTime: {session_time}\nVenue: {venue_name}\n\nCollection is at the main reception. If your collection arrangements change, please let us know in advance.\n\n— {club_name}",
        "evening_before",
        ["REMINDERS"],
        "C",
      ),
    ],
  },
  {
    id: "holiday-camps",
    name: "Holiday Camps",
    description:
      "High-energy camp communications from booking through daily reminders and wrap-up.",
    tone: "Energetic + informative",
    categories: ["CAMPS", "REMINDERS", "BOOKING", "SUPPORT"],
    featuredExample: {
      label: "Camp starts tomorrow",
      subject: "Camp starts tomorrow — {activity_name}",
      body: "Hi {parent_name},\n\n{child_name}'s holiday camp starts tomorrow! Here's everything you need:\n\nActivity: {activity_name}\nDate: {session_date}\nTime: {session_time}\nVenue: {venue_name}\n\nWhat to bring: comfortable clothing, trainers, water bottle, packed lunch, and sun cream.\n\nDrop-off is from 15 minutes before start time. See you tomorrow!\n\n— {club_name}",
    },
    templates: [
      packTemplate(
        "camp-starts-tomorrow",
        "Camp Starts Tomorrow",
        "Day-before camp kickoff reminder.",
        "Camp starts tomorrow — {activity_name}",
        "Hi {parent_name},\n\n{child_name}'s holiday camp starts tomorrow! Here's everything you need:\n\nActivity: {activity_name}\nDate: {session_date}\nTime: {session_time}\nVenue: {venue_name}\n\nWhat to bring: comfortable clothing, trainers, water bottle, packed lunch, and sun cream.\n\nSee you tomorrow!\n\n— {club_name}",
        "day_before_camp",
        ["CAMPS", "REMINDERS"],
        "K",
      ),
      packTemplate(
        "daily-reminder",
        "Daily Camp Reminder",
        "Morning reminder for each camp day.",
        "Camp day today — {activity_name}",
        "Hi {parent_name},\n\nCamp is on today! {child_name} is registered for {activity_name}.\n\nTime: {session_time}\nVenue: {venue_name}\n\nDon't forget water, sun cream, and a packed lunch.\n\n— {club_name}",
        "morning_of",
        ["CAMPS", "REMINDERS"],
      ),
      packTemplate(
        "camp-week-welcome",
        "Camp Week Welcome",
        "Welcome email at the start of camp week.",
        "Welcome to camp week — {activity_name}",
        "Hi {parent_name},\n\nWelcome to {activity_name} at {club_name}! We're thrilled {child_name} is joining us this week.\n\nStart: {session_date} at {session_time}\nVenue: {venue_name}\nReference: {booking_reference}\n\nOur coaches can't wait to get started. Full details: {booking_link}\n\n— The {club_name} camp team",
        "immediate",
        ["CAMPS", "BOOKING"],
      ),
      packTemplate(
        "award-winner",
        "Award Winner",
        "Celebrate a camper's achievement.",
        "Star of the day — {child_name}! ⭐",
        "Hi {parent_name},\n\nWe wanted to share some brilliant news — {child_name} was our Star of the Day at {activity_name} today!\n\nOur coaches were impressed with their effort and attitude. Well done!\n\n— {club_name}",
        "after_session",
        ["CAMPS", "MARKETING"],
      ),
      packTemplate(
        "lost-property",
        "Lost Property",
        "Notify parents about unclaimed items.",
        "Lost property from {activity_name}",
        "Hi {parent_name},\n\nWe have unclaimed items from {activity_name} at {venue_name}. If anything belongs to {child_name}, please collect from reception or reply to describe the item.\n\nUnclaimed items will be donated after 14 days.\n\n— {club_name}",
        "after_session",
        ["SUPPORT"],
      ),
    ],
  },
  {
    id: "football-academy",
    name: "Football Academy",
    description:
      "Trial invitations, squad selection, match prep, and progress updates for academy programmes.",
    sports: ["Football"],
    tone: "Motivating + professional",
    categories: ["BOOKING", "REMINDERS", "SUPPORT"],
    templates: [
      packTemplate(
        "trial-invitation",
        "Trial Invitation",
        "Invite a player to an academy trial session.",
        "You're invited — {club_name} academy trial",
        "Hi {parent_name},\n\nWe'd like to invite {child_name} to a trial session with the {club_name} academy.\n\nDate: {session_date}\nTime: {session_time}\nVenue: {venue_name}\n\nPlease confirm attendance: {booking_link}\n\nWe look forward to seeing {child_name} in action!\n\n— {club_name} Academy",
        "immediate",
        ["BOOKING", "MARKETING"],
      ),
      packTemplate(
        "squad-selection",
        "Squad Selection",
        "Notify parents of squad placement decisions.",
        "Squad selection update — {activity_name}",
        "Hi {parent_name},\n\nFollowing recent trials, we're pleased to confirm {child_name}'s squad placement for {activity_name}.\n\nTraining starts: {session_date} at {session_time}\nVenue: {venue_name}\n\nFull schedule: {booking_link}\n\n— {club_name} Academy",
        "immediate",
        ["BOOKING", "SUPPORT"],
      ),
      packTemplate(
        "match-reminder",
        "Match Reminder",
        "Reminder before a fixture or match day.",
        "Match day — {activity_name} on {session_date}",
        "Hi {parent_name},\n\nMatch day reminder for {child_name}!\n\nFixture: {activity_name}\nDate: {session_date}\nKick-off: {session_time}\nVenue: {venue_name}\n\nPlease arrive 30 minutes early in full kit. Good luck!\n\n— {club_name}",
        "24h_before",
        ["REMINDERS"],
      ),
      packTemplate(
        "session-reminder",
        "Training Session Reminder",
        "Reminder before a training session.",
        "Training tomorrow — {activity_name}",
        "Hi {parent_name},\n\nReminder: {child_name} has academy training for {activity_name} on {session_date} at {session_time} at {venue_name}.\n\nBring boots, shin pads, and a water bottle.\n\n— {club_name} Academy",
        "24h_before",
        ["REMINDERS"],
        "C",
      ),
      packTemplate(
        "progress-update",
        "Progress Update",
        "Share development feedback with parents.",
        "Progress update — {child_name}",
        "Hi {parent_name},\n\nOur coaching team wanted to share a progress update for {child_name} at {activity_name}.\n\nThey're showing great commitment and we see real improvement. Keep encouraging them — details of upcoming sessions: {booking_link}\n\n— {club_name} Academy",
        "after_final_session",
        ["SUPPORT"],
      ),
    ],
  },
  {
    id: "performing-arts",
    name: "Performing Arts",
    description:
      "Rehearsal reminders, costume notices, performance invites, and show cancellations.",
    tone: "Creative + warm",
    categories: ["REMINDERS", "BOOKING", "SUPPORT", "EMERGENCY"],
    templates: [
      packTemplate(
        "rehearsal-reminder",
        "Rehearsal Reminder",
        "Reminder before a rehearsal session.",
        "Rehearsal reminder — {activity_name}",
        "Hi {parent_name},\n\nReminder: {child_name} has rehearsal for {activity_name} on {session_date} at {session_time} at {venue_name}.\n\nPlease arrive 10 minutes early. Break a leg!\n\n— {club_name}",
        "24h_before",
        ["REMINDERS"],
        "C",
      ),
      packTemplate(
        "costume-reminder",
        "Costume Reminder",
        "Reminder to bring required costume or props.",
        "Costume reminder — {activity_name}",
        "Hi {parent_name},\n\nPlease ensure {child_name} brings their costume and any listed props for {activity_name} on {session_date}.\n\nIf you need help sourcing items, contact us at {club_email}.\n\n— {club_name}",
        "evening_before",
        ["REMINDERS"],
      ),
      packTemplate(
        "performance-invite",
        "Performance Invite",
        "Invite parents to a performance or show.",
        "You're invited — {activity_name} performance",
        "Hi {parent_name},\n\nWe're delighted to invite you to {child_name}'s performance of {activity_name}!\n\nDate: {session_date}\nTime: {session_time}\nVenue: {venue_name}\n\nTickets and details: {booking_link}\n\nWe can't wait to share what they've been working on.\n\n— {club_name}",
        "immediate",
        ["MARKETING", "BOOKING"],
      ),
      packTemplate(
        "show-cancellation",
        "Show Cancellation",
        "Notify parents when a performance is cancelled.",
        "Performance cancelled — {activity_name}",
        "Hi {parent_name},\n\nWe're sorry to inform you that the {activity_name} performance on {session_date} has been cancelled.\n\n{club_name} will contact you about rescheduling or refunds. Questions: {club_email}.\n\n— {club_name}",
        "immediate",
        ["EMERGENCY", "SUPPORT"],
        "D",
      ),
    ],
  },
  {
    id: "education-tutoring",
    name: "Education / Tutoring",
    description:
      "Homework reminders, progress reports, lesson reminders, and exam preparation messages.",
    tone: "Supportive + clear",
    categories: ["REMINDERS", "SUPPORT", "BOOKING"],
    templates: [
      packTemplate(
        "homework-reminder",
        "Homework Reminder",
        "Reminder about assigned homework or prep work.",
        "Homework reminder — {activity_name}",
        "Hi {parent_name},\n\nFriendly reminder for {child_name}: please complete the homework set during {activity_name} before the next session on {session_date}.\n\nIf you have questions, contact us at {club_email}.\n\n— {club_name}",
        "evening_before",
        ["REMINDERS"],
      ),
      packTemplate(
        "progress-report",
        "Progress Report",
        "Share learning progress with parents.",
        "Progress report — {child_name}",
        "Hi {parent_name},\n\nWe've prepared a progress update for {child_name} in {activity_name}.\n\nThey're making steady progress and we recommend continuing with the current programme. Next session: {session_date} at {session_time}.\n\n— {club_name}",
        "after_final_session",
        ["SUPPORT"],
      ),
      packTemplate(
        "lesson-reminder",
        "Lesson Reminder",
        "Reminder before a tutoring session.",
        "Lesson tomorrow — {activity_name}",
        "Hi {parent_name},\n\nReminder: {child_name} has a {activity_name} lesson on {session_date} at {session_time} at {venue_name}.\n\nPlease bring any materials noted in the last session.\n\n— {club_name}",
        "24h_before",
        ["REMINDERS"],
        "C",
      ),
      packTemplate(
        "exam-prep",
        "Exam Prep",
        "Exam preparation guidance and schedule.",
        "Exam prep — {activity_name}",
        "Hi {parent_name},\n\nWith exams approaching, here's how we're supporting {child_name} in {activity_name}:\n\nNext prep session: {session_date} at {session_time}\nVenue: {venue_name}\n\nEncourage regular revision at home. We're here if you need extra support — {club_email}.\n\n— {club_name}",
        "immediate",
        ["SUPPORT", "REMINDERS"],
      ),
    ],
  },
  {
    id: "gymnastics-dance",
    name: "Gymnastics / Dance",
    description:
      "Uniform reminders, showcase invites, and attendance alerts for gymnastics and dance clubs.",
    tone: "Encouraging + precise",
    categories: ["REMINDERS", "BOOKING", "SUPPORT"],
    templates: [
      packTemplate(
        "uniform-reminder",
        "Uniform Reminder",
        "Reminder about required uniform or attire.",
        "Uniform reminder — {activity_name}",
        "Hi {parent_name},\n\nPlease ensure {child_name} wears the correct uniform for {activity_name} on {session_date}.\n\nHair tied back, no jewellery, and appropriate footwear. Questions? {club_email}\n\n— {club_name}",
        "evening_before",
        ["REMINDERS"],
      ),
      packTemplate(
        "showcase-invite",
        "Showcase Invite",
        "Invite families to a showcase or recital.",
        "Showcase invitation — {activity_name}",
        "Hi {parent_name},\n\nYou're invited to {child_name}'s {activity_name} showcase!\n\nDate: {session_date}\nTime: {session_time}\nVenue: {venue_name}\n\nReserve your place: {booking_link}\n\n— {club_name}",
        "immediate",
        ["MARKETING", "BOOKING"],
      ),
      packTemplate(
        "attendance-alert",
        "Attendance Alert",
        "Sent when a child is absent without notice.",
        "We missed {child_name} today",
        "Hi {parent_name},\n\nWe noticed {child_name} wasn't present at {activity_name} today ({session_date}).\n\nIf this was unexpected, please let us know everything is okay by replying or calling {club_phone}.\n\n— {club_name}",
        "after_session",
        ["SUPPORT"],
        "L",
      ),
    ],
  },
  {
    id: "franchise-pack",
    name: "Franchise Pack",
    description:
      "Central announcements, venue updates, franchise offers, and regional events for multi-site networks.",
    tone: "Brand-consistent + authoritative",
    categories: ["MARKETING", "SUPPORT", "BOOKING"],
    templates: [
      packTemplate(
        "central-announcement",
        "Central Announcement",
        "Network-wide announcement from head office.",
        "Important update from {club_name}",
        "Hi {parent_name},\n\nWe have an important update regarding {activity_name} across our {club_name} network.\n\nPlease read the full details on our website: {club_website}\n\nFor local questions, contact {club_email} or {club_phone}.\n\n— {club_name} Head Office",
        "immediate",
        ["MARKETING"],
      ),
      packTemplate(
        "venue-update",
        "Venue Update",
        "Notify parents of a venue change.",
        "Venue update — {activity_name}",
        "Hi {parent_name},\n\nPlease note a venue change for {child_name}'s {activity_name} session.\n\nNew venue: {venue_name}\nDate: {session_date}\nTime: {session_time}\n\nReference: {booking_reference}\n\n— {club_name}",
        "immediate",
        ["SUPPORT", "BOOKING"],
        "I",
      ),
      packTemplate(
        "franchise-offer",
        "Franchise Offer",
        "Promotional offer across the franchise network.",
        "Exclusive offer for {club_name} families",
        "Hi {parent_name},\n\nAs a valued {club_name} family, we're pleased to offer you an exclusive promotion on {activity_name}.\n\nBook before {session_date}: {booking_link}\n\nTerms apply. Marketing messages are only sent where consent has been given.\n\n— {club_name}",
        "immediate",
        ["MARKETING"],
      ),
      packTemplate(
        "region-event",
        "Region Event",
        "Invite to a regional franchise event.",
        "Regional event — join us on {session_date}",
        "Hi {parent_name},\n\nYou're invited to a regional {club_name} event!\n\nActivity: {activity_name}\nDate: {session_date}\nTime: {session_time}\nVenue: {venue_name}\n\nRegister: {booking_link}\n\n— {club_name}",
        "immediate",
        ["MARKETING", "BOOKING"],
      ),
    ],
  },
  {
    id: "premium-club-pack",
    name: "Premium Club Pack",
    description:
      "Luxury tone for high-end clubs — refined language, white-glove service feel.",
    tone: "Luxury + refined",
    categories: ["BOOKING", "PAYMENTS", "REMINDERS", "REVIEWS"],
    featuredExample: {
      label: "Reserved place confirmation",
      subject: "Your place has been reserved — {activity_name}",
      body: "Dear {parent_name},\n\nYour place has been reserved for {child_name} on {activity_name} with {club_name}.\n\nSession: {session_date} at {session_time}\nVenue: {venue_name}\nReference: {booking_reference}\n\nOur concierge team is at your service for any special requirements. View your booking: {booking_link}\n\nWe look forward to welcoming your family.\n\n— {club_name}",
    },
    templates: [
      packTemplate(
        "booking-confirmation",
        "Booking Confirmation",
        "Luxury booking confirmation.",
        "Your place has been reserved — {activity_name}",
        "Dear {parent_name},\n\nYour place has been reserved for {child_name} on {activity_name} with {club_name}.\n\nSession: {session_date} at {session_time}\nVenue: {venue_name}\nReference: {booking_reference}\n\nOur concierge team is at your service for any special requirements. View your booking: {booking_link}\n\nWe look forward to welcoming your family.\n\n— {club_name}",
        "immediate",
        ["BOOKING"],
        "A",
      ),
      packTemplate(
        "payment-confirmation",
        "Payment Confirmation",
        "Refined payment receipt.",
        "Payment confirmed — {amount_paid}",
        "Dear {parent_name},\n\nWe confirm receipt of {amount_paid} for {child_name}'s booking on {activity_name}.\n\nReference: {booking_reference}\n\nThank you for your continued trust in {club_name}.\n\n— {club_name}",
        "immediate",
        ["PAYMENTS"],
        "B",
      ),
      packTemplate(
        "session-reminder",
        "Session Reminder",
        "Elegant pre-session reminder.",
        "We look forward to seeing you — {session_date}",
        "Dear {parent_name},\n\nA gentle reminder that {child_name} is expected for {activity_name} on {session_date} at {session_time} at {venue_name}.\n\nShould you require any assistance, our team is available at {club_phone}.\n\n— {club_name}",
        "24h_before",
        ["REMINDERS"],
        "C",
      ),
      packTemplate(
        "review-request",
        "Review Request",
        "Refined review invitation.",
        "We value your feedback",
        "Dear {parent_name},\n\nWe hope {child_name} enjoyed their experience at {activity_name}. Your perspective helps us maintain the standards you expect from {club_name}.\n\nShare your review: {review_link}\n\nWith gratitude,\n— {club_name}",
        "after_final_session",
        ["REVIEWS"],
        "F",
      ),
    ],
  },
  {
    id: "playvera-recommended",
    name: "PlayVera / Activora Recommended",
    description:
      "The complete Activora platform template set — auto-installed for every new club account.",
    tone: "Platform optimised",
    categories: ["BOOKING", "PAYMENTS", "REMINDERS", "REVIEWS", "CAMPS", "SUPPORT"],
    isAutoInstalled: true,
    templates: TEMPLATE_KEY_ORDER.map((key) => {
      const platform = PLATFORM_DEFAULT_TEMPLATES.find(
        (entry) => entry.templateKey === key,
      )!;

      return packTemplate(
        `platform-${key.toLowerCase()}`,
        platform.name,
        platform.description,
        platform.subject,
        platform.body,
        platform.sendDelay,
        inferCategoriesFromPlatformKey(key),
        key,
      );
    }),
  },
];

function inferCategoriesFromPlatformKey(key: TemplateKey): PackCategory[] {
  const map: Partial<Record<TemplateKey, PackCategory[]>> = {
    A: ["BOOKING"],
    B: ["PAYMENTS"],
    C: ["REMINDERS"],
    D: ["SUPPORT", "BOOKING"],
    E: ["PAYMENTS"],
    F: ["REVIEWS"],
    G: ["MARKETING"],
    H: ["BOOKING"],
    I: ["SUPPORT"],
    J: ["SUPPORT", "BOOKING"],
    K: ["CAMPS", "REMINDERS"],
    L: ["SUPPORT"],
    M: ["BOOKING"],
  };

  return map[key] ?? ["SUPPORT"];
}

export function getAllPacks(): TemplatePackDefinition[] {
  const custom = readJson<TemplatePackDefinition[]>(CUSTOM_PACKS_KEY, []);
  return [...TEMPLATE_PACKS, ...custom];
}

export function getPackById(packId: string): TemplatePackDefinition | undefined {
  return getAllPacks().find((pack) => pack.id === packId);
}

export function getInstalledPackIds(providerId = getProviderId()): string[] {
  const store = readJson<Record<string, string[]>>(INSTALLED_PACKS_KEY, {});
  return store[providerId] ?? [];
}

function saveInstalledPackIds(providerId: string, packIds: string[]): void {
  const store = readJson<Record<string, string[]>>(INSTALLED_PACKS_KEY, {});
  store[providerId] = packIds;
  writeJson(INSTALLED_PACKS_KEY, store);
}

export function isPackInstalled(
  packId: string,
  providerId = getProviderId(),
): boolean {
  return getInstalledPackIds(providerId).includes(packId);
}

export function getClubCustomPackTemplates(
  providerId = getProviderId(),
): ClubCustomPackTemplate[] {
  const store = readJson<Record<string, ClubCustomPackTemplate[]>>(
    CUSTOM_PACK_TEMPLATES_KEY,
    {},
  );
  return store[providerId] ?? [];
}

function saveClubCustomPackTemplates(
  providerId: string,
  templates: ClubCustomPackTemplate[],
): void {
  const store = readJson<Record<string, ClubCustomPackTemplate[]>>(
    CUSTOM_PACK_TEMPLATES_KEY,
    {},
  );
  store[providerId] = templates;
  writeJson(CUSTOM_PACK_TEMPLATES_KEY, store);
}

function buildOverrideFromPackTemplate(
  pack: TemplatePackDefinition,
  template: PackTemplateDefinition,
  providerId: string,
): MessageTemplateRecord | null {
  if (!template.platformKey) {
    return null;
  }

  const platform =
    getPlatformTemplates().find(
      (entry) => entry.templateKey === template.platformKey,
    ) ??
    PLATFORM_DEFAULT_TEMPLATES.find(
      (entry) => entry.templateKey === template.platformKey,
    );

  if (!platform) {
    return null;
  }

  const channels = template.channels ?? platform.channels;

  return {
    ...platform,
    id: `provider-template-${providerId}-${template.platformKey.toLowerCase()}`,
    scope: "provider",
    providerId,
    name: template.name,
    description: template.description,
    subject: template.subject,
    body: template.body,
    sendDelay: template.sendDelay,
    channels,
    channel: channels[0] ?? "email",
    enabled: true,
    updatedAt: nowIso(),
    createdAt: nowIso(),
  };
}

function buildCustomFromPackTemplate(
  pack: TemplatePackDefinition,
  template: PackTemplateDefinition,
  providerId: string,
): ClubCustomPackTemplate {
  const channels = template.channels ?? ["email"];

  return {
    id: `custom-${providerId}-${pack.id}-${template.id}`,
    providerId,
    packId: pack.id,
    packTemplateId: template.id,
    name: template.name,
    description: template.description,
    subject: template.subject,
    body: template.body,
    enabled: true,
    sendDelay: template.sendDelay,
    channel: channels[0] ?? "email",
    channels,
    categories: template.categories,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

export function installPack(
  clubId: string,
  packId: string,
): InstallPackResult {
  const pack = getPackById(packId);

  if (!pack) {
    return { success: false, error: "Pack not found" };
  }

  if (!isBrowser()) {
    return { success: false, error: "Install is only available in the browser" };
  }

  let templatesActive = 0;
  const existingCustom = getClubCustomPackTemplates(clubId);
  const customById = new Map(existingCustom.map((entry) => [entry.id, entry]));

  for (const template of pack.templates) {
    const override = buildOverrideFromPackTemplate(pack, template, clubId);

    if (override) {
      saveClubTemplateOverride(override, clubId);
      templatesActive += 1;
      continue;
    }

    const custom = buildCustomFromPackTemplate(pack, template, clubId);
    customById.set(custom.id, custom);
    templatesActive += 1;
  }

  saveClubCustomPackTemplates(clubId, Array.from(customById.values()));

  const installed = getInstalledPackIds(clubId);
  if (!installed.includes(packId)) {
    saveInstalledPackIds(clubId, [...installed, packId]);
  }

  return { success: true, templatesActive, packName: pack.name };
}

export function duplicatePack(
  packId: string,
  providerId = getProviderId(),
): TemplatePackDefinition | null {
  const source = getPackById(packId);

  if (!source || !isBrowser()) {
    return null;
  }

  const duplicate: TemplatePackDefinition = {
    ...source,
    id: `${source.id}-copy-${Date.now()}`,
    name: `${source.name} (Copy)`,
    isDefault: false,
    isAutoInstalled: false,
    templates: source.templates.map((template) => ({
      ...template,
      id: `${template.id}-copy-${Date.now()}`,
    })),
  };

  const custom = readJson<TemplatePackDefinition[]>(CUSTOM_PACKS_KEY, []);
  writeJson(CUSTOM_PACKS_KEY, [...custom, duplicate]);

  installPack(providerId, duplicate.id);

  return duplicate;
}

export function saveAsOrganisationDefault(
  packId: string,
  providerId = getProviderId(),
): boolean {
  if (!isBrowser()) {
    return false;
  }

  writeJson(ORG_DEFAULT_PACK_KEY, { packId, providerId, savedAt: nowIso() });
  return true;
}

export function getOrganisationDefaultPackId(): string | null {
  const saved = readJson<{ packId: string } | null>(ORG_DEFAULT_PACK_KEY, null);
  return saved?.packId ?? null;
}

export function exportClubTemplates(
  providerId = getProviderId(),
  packId?: string,
): ExportedClubTemplates {
  const pack = packId ? getPackById(packId) : undefined;

  return {
    version: 1,
    exportedAt: nowIso(),
    providerId,
    packId,
    packName: pack?.name,
    overrides: getClubTemplateOverrides(providerId),
    customTemplates: getClubCustomPackTemplates(providerId),
  };
}

export function importClubTemplates(
  data: ExportedClubTemplates,
  providerId = getProviderId(),
): { imported: number } {
  if (!isBrowser()) {
    return { imported: 0 };
  }

  let imported = 0;

  for (const override of data.overrides) {
    saveClubTemplateOverride({ ...override, providerId }, providerId);
    imported += 1;
  }

  const existing = getClubCustomPackTemplates(providerId);
  const merged = new Map(existing.map((entry) => [entry.id, entry]));

  for (const custom of data.customTemplates) {
    merged.set(custom.id, { ...custom, providerId });
    imported += 1;
  }

  saveClubCustomPackTemplates(providerId, Array.from(merged.values()));

  if (data.packId && !isPackInstalled(data.packId, providerId)) {
    saveInstalledPackIds(providerId, [
      ...getInstalledPackIds(providerId),
      data.packId,
    ]);
  }

  return { imported };
}

export function downloadTemplatesJson(
  providerId = getProviderId(),
  packId?: string,
): void {
  if (!isBrowser()) {
    return;
  }

  const payload = exportClubTemplates(providerId, packId);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `playvera-templates-${providerId}${packId ? `-${packId}` : ""}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
