import type { MergeTagContext } from "./types";

export const MERGE_TAGS: Array<{ tag: string; label: string }> = [
  { tag: "{parent_name}", label: "Parent name" },
  { tag: "{child_name}", label: "Child name" },
  { tag: "{club_name}", label: "Club name" },
  { tag: "{activity_name}", label: "Activity name" },
  { tag: "{session_date}", label: "Session date" },
  { tag: "{session_time}", label: "Session time" },
  { tag: "{venue_name}", label: "Venue name" },
  { tag: "{booking_reference}", label: "Booking reference" },
  { tag: "{review_link}", label: "Review link" },
  { tag: "{birthday_age}", label: "Birthday age" },
];

export function createSampleMergeContext(): MergeTagContext {
  return {
    parent_name: "Helen Carter",
    child_name: "Mia Carter",
    club_name: "PlayVera Juniors",
    activity_name: "Saturday Football Skills",
    session_date: "Saturday 14 June 2026",
    session_time: "10:00",
    venue_name: "Riverside Community Centre",
    booking_reference: "PV-20481",
    review_link: "https://playvera.example/reviews/PV-20481",
    birthday_age: "8",
  };
}

export function applyMergeTags(
  text: string,
  context: MergeTagContext,
): string {
  return text
    .replaceAll("{parent_name}", context.parent_name)
    .replaceAll("{child_name}", context.child_name)
    .replaceAll("{club_name}", context.club_name)
    .replaceAll("{activity_name}", context.activity_name)
    .replaceAll("{session_date}", context.session_date)
    .replaceAll("{session_time}", context.session_time)
    .replaceAll("{venue_name}", context.venue_name)
    .replaceAll("{booking_reference}", context.booking_reference)
    .replaceAll("{review_link}", context.review_link)
    .replaceAll("{birthday_age}", context.birthday_age);
}
