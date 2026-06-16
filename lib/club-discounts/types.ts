export type DiscountType = "percentage" | "fixed";

export type DiscountKind = "promo" | "sibling" | "early_bird";

export type SiblingMinChildren = 2 | 3;

export type DiscountAppliesTo =
  | "all_activities"
  | "selected_activity"
  | "selected_session"
  | "selected_venue"
  | "holiday_camp"
  | "after_school_club";

export type AutoDiscountAppliesTo =
  | "all_activities"
  | "selected_activity"
  | "selected_venue";

export type DiscountStatus =
  | "active"
  | "paused"
  | "expired"
  | "scheduled"
  | "archived"
  | "inactive";

export type ClubDiscount = {
  id: string;
  providerId: string;
  kind: DiscountKind;
  name: string;
  code: string;
  type: DiscountType;
  value: number;
  appliesTo: DiscountAppliesTo;
  appliesToLabel?: string;
  minimumSpend: number;
  usageLimitTotal: number | null;
  usageLimitPerParent: number | null;
  startDate: string;
  endDate: string | null;
  /** Sibling discount: minimum children booked by same parent */
  minChildren?: SiblingMinChildren;
  /** Early bird discount: booking deadline (ISO datetime) */
  deadlineAt?: string;
  /** Whether this discount can stack with other discounts */
  canCombine: boolean;
  isActive: boolean;
  isPaused: boolean;
  isArchived: boolean;
  redemptionCount: number;
  totalDiscountedAmount: number;
  createdAt: string;
  updatedAt: string;
};

export type DiscountRedemption = {
  id: string;
  discountId: string;
  discountCode: string;
  parentName: string;
  parentEmail: string;
  bookingId: string;
  bookingReference: string;
  activityName: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  redeemedAt: string;
};

export type DiscountMetrics = {
  activeDiscounts: number;
  totalRedemptions: number;
  revenueDiscounted: number;
  expiringSoon: number;
};

export type DiscountFilters = {
  query: string;
  status: DiscountStatus | "all";
  type: DiscountType | "all";
};

export type DiscountFormInput = {
  name: string;
  code: string;
  type: DiscountType;
  value: number;
  appliesTo: DiscountAppliesTo;
  appliesToLabel?: string;
  minimumSpend: number;
  usageLimitTotal: number | null;
  usageLimitPerParent: number | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
};

export type SiblingDiscountFormInput = {
  name: string;
  type: DiscountType;
  value: number;
  minChildren: SiblingMinChildren;
  appliesTo: AutoDiscountAppliesTo;
  appliesToLabel?: string;
  canCombine: boolean;
  isActive: boolean;
};

export type EarlyBirdDiscountFormInput = {
  name: string;
  type: DiscountType;
  value: number;
  deadlineAt: string;
  appliesTo: AutoDiscountAppliesTo;
  appliesToLabel?: string;
  usageLimitTotal: number | null;
  canCombine: boolean;
  isActive: boolean;
};

export const DISCOUNT_KIND_LABELS: Record<DiscountKind, string> = {
  promo: "Promo code",
  sibling: "Sibling",
  early_bird: "Early bird",
};

export const APPLIES_TO_LABELS: Record<DiscountAppliesTo, string> = {
  all_activities: "All activities",
  selected_activity: "Selected activity",
  selected_session: "Selected session / date",
  selected_venue: "Selected venue",
  holiday_camp: "Holiday camp",
  after_school_club: "After-school club",
};

export const AUTO_APPLIES_TO_LABELS: Record<AutoDiscountAppliesTo, string> = {
  all_activities: "All activities",
  selected_activity: "Selected activities",
  selected_venue: "Selected venues",
};

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  percentage: "Percentage",
  fixed: "Fixed amount",
};

export const DISCOUNT_STATUS_LABELS: Record<DiscountStatus, string> = {
  active: "Active",
  paused: "Paused",
  expired: "Expired",
  scheduled: "Scheduled",
  archived: "Archived",
  inactive: "Inactive",
};

export function resolveDiscountStatus(
  discount: ClubDiscount,
  now = new Date(),
): DiscountStatus {
  if (discount.isArchived) {
    return "archived";
  }

  if (discount.isPaused) {
    return "paused";
  }

  if (discount.kind === "early_bird" && discount.deadlineAt) {
    const deadline = new Date(discount.deadlineAt);
    if (deadline < now) {
      return "expired";
    }
  }

  const start = new Date(`${discount.startDate}T00:00:00`);
  const end = discount.endDate
    ? new Date(`${discount.endDate}T23:59:59`)
    : null;

  if (end && end < now) {
    return "expired";
  }

  if (start > now) {
    return "scheduled";
  }

  if (!discount.isActive) {
    return "inactive";
  }

  return "active";
}

export function formatDiscountValue(discount: ClubDiscount): string {
  if (discount.type === "percentage") {
    return `${discount.value}%`;
  }

  return `£${discount.value.toFixed(2)}`;
}

export function formatDiscountDeadline(discount: ClubDiscount): string {
  if (discount.kind === "early_bird" && discount.deadlineAt) {
    return new Date(discount.deadlineAt).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (!discount.endDate) {
    return "No end date";
  }

  return new Date(`${discount.endDate}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function siblingFormToDiscountInput(
  input: SiblingDiscountFormInput,
): Omit<DiscountFormInput, "code"> {
  const today = new Date().toISOString().slice(0, 10);
  return {
    name: input.name,
    type: input.type,
    value: input.value,
    appliesTo: input.appliesTo,
    appliesToLabel: input.appliesToLabel,
    minimumSpend: 0,
    usageLimitTotal: null,
    usageLimitPerParent: null,
    startDate: today,
    endDate: null,
    isActive: input.isActive,
  };
}

export function earlyBirdFormToDiscountInput(
  input: EarlyBirdDiscountFormInput,
): Omit<DiscountFormInput, "code"> {
  const today = new Date().toISOString().slice(0, 10);
  const deadlineDate = input.deadlineAt.slice(0, 10);
  return {
    name: input.name,
    type: input.type,
    value: input.value,
    appliesTo: input.appliesTo,
    appliesToLabel: input.appliesToLabel,
    minimumSpend: 0,
    usageLimitTotal: input.usageLimitTotal,
    usageLimitPerParent: null,
    startDate: today,
    endDate: deadlineDate,
    isActive: input.isActive,
  };
}
