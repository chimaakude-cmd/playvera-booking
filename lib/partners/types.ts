/**
 * Partner Directory types — localStorage today, Supabase `partners` + `partner_claims` later.
 */

export type PartnerCategory =
  | "equipment"
  | "insurance"
  | "training"
  | "accounting"
  | "legal"
  | "marketing"
  | "staff_benefits"
  | "venues"
  | "community_programmes"
  | "technology"
  | "finance"
  | "participation";

export type PartnerStatus =
  | "draft"
  | "pending"
  | "approved"
  | "featured"
  | "hidden"
  | "archived";

export type PartnerBenefitType =
  | "discount"
  | "free_trial"
  | "referral"
  | "exclusive_pricing"
  | "service_bundle"
  | "membership";

export type PartnerOffer = {
  title: string;
  description: string;
  terms: string;
  promoCode: string;
  validUntil: string;
};

export type PartnerAnalytics = {
  views: number;
  clicks: number;
  claims: number;
  introductions: number;
};

export type Partner = {
  id: string;
  name: string;
  slug: string;
  category: PartnerCategory;
  shortDescription: string;
  benefitOffered: string;
  benefitType: PartnerBenefitType;
  website: string;
  contactEmail: string;
  contactPhone: string;
  logoDataUrl: string | null;
  offer: PartnerOffer;
  status: PartnerStatus;
  recommended: boolean;
  isNew: boolean;
  analytics: PartnerAnalytics;
  createdAt: string;
  updatedAt: string;
};

export type PartnerClaimType = "claim" | "enquiry" | "introduction";

export type PartnerClaim = {
  id: string;
  partnerId: string;
  partnerName: string;
  type: PartnerClaimType;
  clubId: string | null;
  clubName: string | null;
  contactName: string;
  contactEmail: string;
  message: string;
  createdAt: string;
};

export type CreatePartnerInput = Omit<
  Partner,
  "id" | "slug" | "analytics" | "createdAt" | "updatedAt"
>;

export type UpdatePartnerInput = Partial<
  Omit<Partner, "id" | "createdAt" | "updatedAt">
>;

export type CreatePartnerClaimInput = Omit<
  PartnerClaim,
  "id" | "createdAt"
>;

export const PARTNER_CATEGORY_LABELS: Record<PartnerCategory, string> = {
  equipment: "Equipment",
  insurance: "Insurance",
  training: "Training",
  accounting: "Accounting",
  legal: "Legal",
  marketing: "Marketing",
  staff_benefits: "Staff benefits",
  venues: "Venues",
  community_programmes: "Community programmes",
  technology: "Technology",
  finance: "Finance",
  participation: "Participation",
};

export const PARTNER_STATUS_LABELS: Record<PartnerStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  approved: "Approved",
  featured: "Featured",
  hidden: "Hidden",
  archived: "Archived",
};

export const PARTNER_BENEFIT_TYPE_LABELS: Record<PartnerBenefitType, string> = {
  discount: "Discount",
  free_trial: "Free trial",
  referral: "Referral bonus",
  exclusive_pricing: "Exclusive pricing",
  service_bundle: "Service bundle",
  membership: "Membership perk",
};

export const PARTNER_CATEGORIES: PartnerCategory[] = [
  "equipment",
  "insurance",
  "training",
  "accounting",
  "legal",
  "marketing",
  "staff_benefits",
  "venues",
  "community_programmes",
  "technology",
  "finance",
  "participation",
];

export const PARTNER_STATUSES: PartnerStatus[] = [
  "draft",
  "pending",
  "approved",
  "featured",
  "hidden",
  "archived",
];

export const PARTNER_BENEFIT_TYPES: PartnerBenefitType[] = [
  "discount",
  "free_trial",
  "referral",
  "exclusive_pricing",
  "service_bundle",
  "membership",
];

export function isPartnerPubliclyVisible(status: PartnerStatus): boolean {
  return status === "approved" || status === "featured";
}

export function slugifyPartnerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
