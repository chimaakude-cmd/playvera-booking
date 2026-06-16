/**
 * Partnership enquiry types — localStorage today, Supabase later.
 */

export type PartnershipCategory =
  | "provider_benefits"
  | "staff_benefits"
  | "participation"
  | "commercial";

export type PartnershipEnquiryStatus =
  | "new"
  | "discovery"
  | "meeting_booked"
  | "negotiation"
  | "live"
  | "closed";

export type PartnershipEnquiry = {
  id: string;
  organisationName: string;
  website: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  partnershipCategory: PartnershipCategory;
  country: string;
  proposedIdea: string;
  expectedOutcomes: string;
  preferredMeetingDate: string;
  additionalInformation: string;
  status: PartnershipEnquiryStatus;
  assignedAdminId: string | null;
  assignedAdminName: string | null;
  followUpDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PartnershipNote = {
  id: string;
  enquiryId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type CreatePartnershipEnquiryInput = Omit<
  PartnershipEnquiry,
  | "id"
  | "status"
  | "assignedAdminId"
  | "assignedAdminName"
  | "followUpDate"
  | "createdAt"
  | "updatedAt"
>;

export const PARTNERSHIP_CATEGORY_LABELS: Record<PartnershipCategory, string> =
  {
    provider_benefits: "Provider Benefits Partners",
    staff_benefits: "Staff Benefits Partners",
    participation: "Participation Partners",
    commercial: "Commercial Partners",
  };

export const PARTNERSHIP_STATUS_LABELS: Record<
  PartnershipEnquiryStatus,
  string
> = {
  new: "New",
  discovery: "Discovery",
  meeting_booked: "Meeting booked",
  negotiation: "Negotiation",
  live: "Live",
  closed: "Closed",
};

export const PARTNERSHIP_COUNTRY_OPTIONS = [
  "United Kingdom",
  "Republic of Ireland",
  "Australia",
  "New Zealand",
  "Other",
] as const;

export type PartnershipTypeCard = {
  id: PartnershipCategory;
  title: string;
  description: string;
  examples: string[];
  benefits: string[];
  ctaLabel: string;
};

export const PARTNERSHIP_TYPE_CARDS: PartnershipTypeCard[] = [
  {
    id: "provider_benefits",
    title: "Provider Benefits Partners",
    description:
      "Offer discounts, services or exclusive benefits to clubs and providers using Activora.",
    examples: [
      "Equipment suppliers",
      "Coaching providers",
      "Insurance companies",
      "Venue providers",
      "Marketing services",
      "Training providers",
      "Accountants",
      "Legal services",
    ],
    benefits: ["Access engaged providers", "Brand exposure", "Joint campaigns"],
    ctaLabel: "Partner with providers",
  },
  {
    id: "staff_benefits",
    title: "Staff Benefits Partners",
    description: "Support the people delivering activities every day.",
    examples: [
      "Gym memberships",
      "Mental wellbeing",
      "Employee discounts",
      "Training platforms",
      "Healthcare",
      "Staff rewards",
    ],
    benefits: [
      "Improve staff wellbeing",
      "Increase retention",
      "Shared initiatives",
    ],
    ctaLabel: "Support our staff",
  },
  {
    id: "participation",
    title: "Participation Partners",
    description:
      "Work with us to increase participation in sport and activities.",
    examples: [
      "National Governing Bodies",
      "Charities",
      "Schools",
      "Community programmes",
      "Local authorities",
      "Youth organisations",
    ],
    benefits: [
      "Community impact",
      "Access to providers",
      "Shared reporting",
    ],
    ctaLabel: "Grow participation",
  },
  {
    id: "commercial",
    title: "Commercial Partners",
    description: "Build strategic long-term partnerships with Activora.",
    examples: [
      "Technology",
      "Finance",
      "Payments",
      "Sponsorship",
      "National campaigns",
    ],
    benefits: [
      "Co-marketing",
      "Product integration",
      "Growth opportunities",
    ],
    ctaLabel: "Explore partnership",
  },
];

export const PARTNERSHIP_STATS = [
  { label: "Providers using Activora", value: "—" },
  { label: "Families reached", value: "—" },
  { label: "Children attending sessions", value: "—" },
  { label: "Activities delivered", value: "—" },
] as const;

export const PARTNERSHIP_MISSION_TEXT =
  "Our mission is simple: help more children access high-quality activities while helping providers grow sustainably.";
