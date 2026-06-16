/**
 * Demo enquiry types — localStorage today, Supabase later.
 */

export type DemoEnquiryLocation =
  | "uk"
  | "republic_of_ireland"
  | "australia"
  | "new_zealand"
  | "other";

export type DemoEnquiryStatus = "new" | "contacted" | "closed";

export type DemoEnquiry = {
  id: string;
  clubName: string;
  businessEmail: string;
  firstName: string;
  lastName: string;
  businessPhone: string;
  jobRole: string;
  programmeSize: string;
  activityType: string;
  startTimeline: string;
  location: DemoEnquiryLocation;
  additionalInfo: string;
  consentGiven: boolean;
  status: DemoEnquiryStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateDemoEnquiryInput = Omit<
  DemoEnquiry,
  "id" | "status" | "createdAt" | "updatedAt"
>;

export const DEMO_ENQUIRY_LOCATION_LABELS: Record<DemoEnquiryLocation, string> =
  {
    uk: "UK",
    republic_of_ireland: "Republic of Ireland",
    australia: "Australia",
    new_zealand: "New Zealand",
    other: "Other",
  };

export const DEMO_ENQUIRY_STATUS_LABELS: Record<DemoEnquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  closed: "Closed",
};

export const DEMO_BENEFITS = [
  "Free 30-minute platform walkthrough",
  "Help setting up your club profile",
  "Support with bookings, payments and registers",
  "Advice on growing your activities",
  "No obligation to sign up",
] as const;

export const PROGRAMME_SIZE_OPTIONS = [
  "Under 50 children",
  "50–150 children",
  "150–500 children",
  "500+ children",
] as const;

export const START_TIMELINE_OPTIONS = [
  "As soon as possible",
  "Within 1 month",
  "1–3 months",
  "Just exploring",
] as const;
