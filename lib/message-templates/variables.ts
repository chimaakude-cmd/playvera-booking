import type { MergeTagContext, TemplateVariable, VariableCategory } from "./types";

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  { tag: "{parent_name}", label: "Parent name", category: "parent", sampleValue: "Helen Carter" },
  { tag: "{child_name}", label: "Child name", category: "child", sampleValue: "Mia Carter" },
  { tag: "{birthday_age}", label: "Birthday age", category: "child", sampleValue: "8" },
  { tag: "{club_name}", label: "Club name", category: "club", sampleValue: "PlayVera Juniors" },
  { tag: "{club_email}", label: "Club email", category: "club", sampleValue: "hello@playvera.example" },
  { tag: "{club_phone}", label: "Club phone", category: "club", sampleValue: "+44 20 7946 0123" },
  { tag: "{club_website}", label: "Club website", category: "club", sampleValue: "https://playvera.example" },
  {
    tag: "{booking_reference}",
    label: "Booking reference",
    category: "booking",
    sampleValue: "PV-20481",
  },
  {
    tag: "{activity_name}",
    label: "Activity name",
    category: "booking",
    sampleValue: "Saturday Football Skills",
  },
  {
    tag: "{session_date}",
    label: "Session date",
    category: "booking",
    sampleValue: "Saturday 14 June 2026",
  },
  { tag: "{session_time}", label: "Session time", category: "booking", sampleValue: "10:00" },
  {
    tag: "{venue_name}",
    label: "Venue name",
    category: "booking",
    sampleValue: "Riverside Community Centre",
  },
  {
    tag: "{booking_link}",
    label: "Booking link",
    category: "booking",
    sampleValue: "https://playvera.example/bookings/PV-20481",
  },
  {
    tag: "{review_link}",
    label: "Review link",
    category: "booking",
    sampleValue: "https://playvera.example/reviews/PV-20481",
  },
  { tag: "{amount_paid}", label: "Amount paid", category: "finance", sampleValue: "£24.00" },
  { tag: "{refund_amount}", label: "Refund amount", category: "finance", sampleValue: "£24.00" },
];

export function getVariablesByCategory(): Record<VariableCategory, TemplateVariable[]> {
  const grouped: Record<VariableCategory, TemplateVariable[]> = {
    parent: [],
    child: [],
    club: [],
    booking: [],
    finance: [],
  };

  for (const variable of TEMPLATE_VARIABLES) {
    grouped[variable.category].push(variable);
  }

  return grouped;
}

export function createSampleMergeContext(): MergeTagContext {
  const context: MergeTagContext = {};

  for (const variable of TEMPLATE_VARIABLES) {
    const key = variable.tag.replace(/[{}]/g, "");
    context[key] = variable.sampleValue;
  }

  return context;
}

export function applyTemplateVariables(
  text: string,
  context: MergeTagContext,
): string {
  let result = text;

  for (const variable of TEMPLATE_VARIABLES) {
    const key = variable.tag.replace(/[{}]/g, "");
    const value = context[key] ?? variable.sampleValue;
    result = result.replaceAll(variable.tag, value);
  }

  return result;
}
