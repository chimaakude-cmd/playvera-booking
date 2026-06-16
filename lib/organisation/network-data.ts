import {
  DEFAULT_ORG_ACTIVITIES,
  DEFAULT_ORG_BOOKINGS,
  DEFAULT_ORG_BROADCASTS,
  DEFAULT_ORG_CAMPAIGNS,
  DEFAULT_ORG_CUSTOMERS,
  DEFAULT_ORG_PARENT_REPLIES,
  DEFAULT_ORG_REGISTERS,
  DEFAULT_ORG_REVIEWS,
  DEFAULT_ORG_STAFF,
  DEFAULT_ORG_TEMPLATES,
} from "./network-defaults";
import type {
  OrgActivity,
  OrgActivityStatus,
  OrgActivityType,
  OrgBooking,
  OrgBookingStatus,
  OrgBroadcast,
  OrgCampaign,
  OrgCustomer,
  OrgMessageTemplate,
  OrgParentReply,
  OrgRegisterSession,
  OrgReview,
  OrgReviewStatus,
  OrgStaffMember,
  OrgStaffRole,
} from "./network-types";

export const ORG_ACTIVITIES_KEY = "activora-org-activities";
export const ORG_BOOKINGS_KEY = "activora-org-bookings";
export const ORG_REGISTERS_KEY = "activora-org-registers";
export const ORG_CUSTOMERS_KEY = "activora-org-customers";
export const ORG_TEMPLATES_KEY = "activora-org-templates";
export const ORG_REPLIES_KEY = "activora-org-replies";
export const ORG_CAMPAIGNS_KEY = "activora-org-campaigns";
export const ORG_BROADCASTS_KEY = "activora-org-broadcasts";
export const ORG_REVIEWS_KEY = "activora-org-reviews";
export const ORG_STAFF_KEY = "activora-org-staff";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function seedIfEmpty<T>(key: string, defaults: T): T {
  if (!isBrowser()) return defaults;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw) as T;
  } catch {
    return defaults;
  }
}

export function formatOrgCurrency(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: pence % 100 === 0 ? 0 : 2,
  }).format(pence / 100);
}

export function formatOrgDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatOrgDateTime(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatOrgLastActive(iso: string): string {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return formatOrgDate(iso);
}

export const ORG_ACTIVITY_TYPE_LABELS: Record<OrgActivityType, string> = {
  camp: "Camp",
  course: "Course",
  class: "Class",
  party: "Party",
  event: "Event",
};

export const ORG_STAFF_ROLE_LABELS: Record<OrgStaffRole, string> = {
  organisation_owner: "Organisation Owner",
  organisation_manager: "Organisation Manager",
  finance_admin: "Finance Admin",
  support_admin: "Support Admin",
  club_manager: "Club Manager",
  coach: "Coach",
};

// --- Activities ---

export type OrgActivityFilters = {
  query: string;
  clubId: string;
  type: OrgActivityType | "all";
  venue: string;
  status: OrgActivityStatus | "all";
  dateFrom: string;
  dateTo: string;
};

export const DEFAULT_ORG_ACTIVITY_FILTERS: OrgActivityFilters = {
  query: "",
  clubId: "all",
  type: "all",
  venue: "all",
  status: "all",
  dateFrom: "",
  dateTo: "",
};

export function getOrgActivities(): OrgActivity[] {
  return seedIfEmpty(ORG_ACTIVITIES_KEY, DEFAULT_ORG_ACTIVITIES);
}

export function getOrgActivityFilterOptions(activities: OrgActivity[]) {
  const clubs = new Map<string, string>();
  const venues = new Set<string>();

  for (const activity of activities) {
    clubs.set(activity.franchiseeClubId, activity.franchiseeClubName);
    venues.add(activity.venue);
  }

  return {
    clubs: Array.from(clubs.entries()).map(([id, name]) => ({ id, name })),
    venues: Array.from(venues).sort(),
  };
}

export function filterOrgActivities(
  activities: OrgActivity[],
  filters: OrgActivityFilters,
): OrgActivity[] {
  const query = filters.query.trim().toLowerCase();

  return activities.filter((activity) => {
    if (filters.clubId !== "all" && activity.franchiseeClubId !== filters.clubId) {
      return false;
    }
    if (filters.type !== "all" && activity.type !== filters.type) return false;
    if (filters.venue !== "all" && activity.venue !== filters.venue) {
      return false;
    }
    if (filters.status !== "all" && activity.status !== filters.status) {
      return false;
    }
    if (filters.dateFrom && activity.endDate < filters.dateFrom) return false;
    if (filters.dateTo && activity.startDate > filters.dateTo) return false;
    if (!query) return true;

    return (
      activity.title.toLowerCase().includes(query) ||
      activity.franchiseeClubName.toLowerCase().includes(query) ||
      activity.venue.toLowerCase().includes(query)
    );
  });
}

// --- Bookings ---

export type OrgBookingFilters = {
  query: string;
  clubId: string;
  paymentStatus: OrgBooking["paymentStatus"] | "all";
  bookingStatus: OrgBookingStatus | "all";
};

export const DEFAULT_ORG_BOOKING_FILTERS: OrgBookingFilters = {
  query: "",
  clubId: "all",
  paymentStatus: "all",
  bookingStatus: "all",
};

export function getOrgBookings(): OrgBooking[] {
  return seedIfEmpty(ORG_BOOKINGS_KEY, DEFAULT_ORG_BOOKINGS);
}

export function getOrgBookingMetrics(bookings: OrgBooking[]) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonth = bookings.filter(
    (b) => new Date(b.sessionDate) >= monthStart,
  );

  return {
    total: bookings.length,
    thisMonth: thisMonth.length,
    revenuePence: bookings
      .filter((b) => b.paymentStatus === "paid")
      .reduce((sum, b) => sum + b.amountPence, 0),
    refunds: bookings.filter(
      (b) =>
        b.paymentStatus === "refunded" || b.paymentStatus === "partial_refund",
    ).length,
    cancelled: bookings.filter((b) => b.bookingStatus === "cancelled").length,
  };
}

export function filterOrgBookings(
  bookings: OrgBooking[],
  filters: OrgBookingFilters,
): OrgBooking[] {
  const query = filters.query.trim().toLowerCase();

  return bookings.filter((booking) => {
    if (filters.clubId !== "all" && booking.franchiseeClubId !== filters.clubId) {
      return false;
    }
    if (
      filters.paymentStatus !== "all" &&
      booking.paymentStatus !== filters.paymentStatus
    ) {
      return false;
    }
    if (
      filters.bookingStatus !== "all" &&
      booking.bookingStatus !== filters.bookingStatus
    ) {
      return false;
    }
    if (!query) return true;

    return (
      booking.parentName.toLowerCase().includes(query) ||
      booking.childName.toLowerCase().includes(query) ||
      booking.reference.toLowerCase().includes(query) ||
      booking.activityTitle.toLowerCase().includes(query)
    );
  });
}

export function getOrgBookingFilterOptions(bookings: OrgBooking[]) {
  const clubs = new Map<string, string>();
  for (const booking of bookings) {
    clubs.set(booking.franchiseeClubId, booking.franchiseeClubName);
  }
  return {
    clubs: Array.from(clubs.entries()).map(([id, name]) => ({ id, name })),
  };
}

// --- Registers ---

export type OrgRegisterFilters = {
  date: string;
  clubId: string;
  activity: string;
  venue: string;
};

export const DEFAULT_ORG_REGISTER_FILTERS: OrgRegisterFilters = {
  date: "",
  clubId: "all",
  activity: "all",
  venue: "all",
};

export function getOrgRegisters(): OrgRegisterSession[] {
  return seedIfEmpty(ORG_REGISTERS_KEY, DEFAULT_ORG_REGISTERS);
}

export function filterOrgRegisters(
  registers: OrgRegisterSession[],
  filters: OrgRegisterFilters,
): OrgRegisterSession[] {
  return registers.filter((row) => {
    if (filters.date && row.date !== filters.date) return false;
    if (filters.clubId !== "all" && row.franchiseeClubId !== filters.clubId) {
      return false;
    }
    if (filters.activity !== "all" && row.activityTitle !== filters.activity) {
      return false;
    }
    if (filters.venue !== "all" && row.venue !== filters.venue) return false;
    return true;
  });
}

export function getOrgRegisterFilterOptions(registers: OrgRegisterSession[]) {
  const clubs = new Map<string, string>();
  const activities = new Set<string>();
  const venues = new Set<string>();

  for (const row of registers) {
    clubs.set(row.franchiseeClubId, row.franchiseeClubName);
    activities.add(row.activityTitle);
    venues.add(row.venue);
  }

  return {
    clubs: Array.from(clubs.entries()).map(([id, name]) => ({ id, name })),
    activities: Array.from(activities).sort(),
    venues: Array.from(venues).sort(),
  };
}

// --- Customers ---

export type OrgCustomerFilters = {
  query: string;
  clubName: string;
};

export const DEFAULT_ORG_CUSTOMER_FILTERS: OrgCustomerFilters = {
  query: "",
  clubName: "all",
};

export function getOrgCustomers(): OrgCustomer[] {
  return seedIfEmpty(ORG_CUSTOMERS_KEY, DEFAULT_ORG_CUSTOMERS);
}

export function getOrgCustomerMetrics(customers: OrgCustomer[]) {
  const active = customers.filter((c) => c.isActive).length;
  const repeat = customers.filter((c) => c.isRepeat).length;
  const avgSpend =
    customers.length > 0
      ? Math.round(
          customers.reduce((sum, c) => sum + c.totalSpendPence, 0) /
            customers.length,
        )
      : 0;

  return {
    total: customers.length,
    active,
    repeat,
    avgSpendPence: avgSpend,
  };
}

export function filterOrgCustomers(
  customers: OrgCustomer[],
  filters: OrgCustomerFilters,
): OrgCustomer[] {
  const query = filters.query.trim().toLowerCase();

  return customers.filter((customer) => {
    if (
      filters.clubName !== "all" &&
      !customer.franchiseeClubs.includes(filters.clubName)
    ) {
      return false;
    }
    if (!query) return true;

    return (
      customer.parentName.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      customer.phone.includes(query) ||
      customer.children.some((child) =>
        child.toLowerCase().includes(query),
      )
    );
  });
}

export function getOrgCustomerFilterOptions(customers: OrgCustomer[]) {
  const clubs = new Set<string>();
  for (const customer of customers) {
    for (const club of customer.franchiseeClubs) clubs.add(club);
  }
  return { clubs: Array.from(clubs).sort() };
}

// --- Communications ---

export type OrgCommunicationsFilters = {
  clubName: string;
  activity: string;
  parentType: OrgParentReply["parentType"] | "all";
  bookingStatus: OrgBookingStatus | "all";
};

export const DEFAULT_ORG_COMMUNICATIONS_FILTERS: OrgCommunicationsFilters = {
  clubName: "all",
  activity: "all",
  parentType: "all",
  bookingStatus: "all",
};

export function getOrgMessageTemplates(): OrgMessageTemplate[] {
  return seedIfEmpty(ORG_TEMPLATES_KEY, DEFAULT_ORG_TEMPLATES);
}

export function getOrgParentReplies(): OrgParentReply[] {
  return seedIfEmpty(ORG_REPLIES_KEY, DEFAULT_ORG_PARENT_REPLIES);
}

export function getOrgCampaigns(): OrgCampaign[] {
  return seedIfEmpty(ORG_CAMPAIGNS_KEY, DEFAULT_ORG_CAMPAIGNS);
}

export function getOrgBroadcasts(): OrgBroadcast[] {
  return seedIfEmpty(ORG_BROADCASTS_KEY, DEFAULT_ORG_BROADCASTS);
}

export function filterOrgParentReplies(
  replies: OrgParentReply[],
  filters: OrgCommunicationsFilters,
): OrgParentReply[] {
  return replies.filter((reply) => {
    if (filters.clubName !== "all" && reply.franchiseeClubName !== filters.clubName) {
      return false;
    }
    if (filters.activity !== "all" && reply.activityTitle !== filters.activity) {
      return false;
    }
    if (filters.parentType !== "all" && reply.parentType !== filters.parentType) {
      return false;
    }
    if (
      filters.bookingStatus !== "all" &&
      reply.bookingStatus !== filters.bookingStatus
    ) {
      return false;
    }
    return true;
  });
}

export function getOrgCommunicationsFilterOptions(replies: OrgParentReply[]) {
  const clubs = new Set<string>();
  const activities = new Set<string>();
  for (const reply of replies) {
    clubs.add(reply.franchiseeClubName);
    activities.add(reply.activityTitle);
  }
  return {
    clubs: Array.from(clubs).sort(),
    activities: Array.from(activities).sort(),
  };
}

// --- Reviews ---

export type OrgReviewFilters = {
  query: string;
  clubId: string;
  status: OrgReviewStatus | "all";
  flaggedOnly: boolean;
};

export const DEFAULT_ORG_REVIEW_FILTERS: OrgReviewFilters = {
  query: "",
  clubId: "all",
  status: "all",
  flaggedOnly: false,
};

export function getOrgReviews(): OrgReview[] {
  return seedIfEmpty(ORG_REVIEWS_KEY, DEFAULT_ORG_REVIEWS);
}

export function getOrgReviewMetrics(reviews: OrgReview[]) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const published = reviews.filter((r) => r.status === "published");
  const avgRating =
    published.length > 0
      ? published.reduce((sum, r) => sum + r.rating, 0) / published.length
      : 0;

  return {
    avgRating,
    total: reviews.length,
    thisMonth: reviews.filter((r) => new Date(r.reviewedAt) >= monthStart)
      .length,
    flagged: reviews.filter((r) => r.flagged).length,
  };
}

export function filterOrgReviews(
  reviews: OrgReview[],
  filters: OrgReviewFilters,
): OrgReview[] {
  const query = filters.query.trim().toLowerCase();

  return reviews.filter((review) => {
    if (filters.clubId !== "all" && review.franchiseeClubId !== filters.clubId) {
      return false;
    }
    if (filters.status !== "all" && review.status !== filters.status) {
      return false;
    }
    if (filters.flaggedOnly && !review.flagged) return false;
    if (!query) return true;

    return (
      review.body.toLowerCase().includes(query) ||
      review.sessionTitle.toLowerCase().includes(query) ||
      review.franchiseeClubName.toLowerCase().includes(query)
    );
  });
}

export function getOrgReviewFilterOptions(reviews: OrgReview[]) {
  const clubs = new Map<string, string>();
  for (const review of reviews) {
    clubs.set(review.franchiseeClubId, review.franchiseeClubName);
  }
  return {
    clubs: Array.from(clubs.entries()).map(([id, name]) => ({ id, name })),
  };
}

export function updateOrgReviewStatus(
  reviewId: string,
  status: OrgReviewStatus,
  flagged?: boolean,
): void {
  if (!isBrowser()) return;
  const reviews = getOrgReviews();
  const index = reviews.findIndex((r) => r.id === reviewId);
  if (index === -1) return;
  reviews[index] = {
    ...reviews[index],
    status,
    flagged: flagged ?? reviews[index].flagged,
  };
  localStorage.setItem(ORG_REVIEWS_KEY, JSON.stringify(reviews));
}

// --- Staff ---

export type OrgStaffFilters = {
  query: string;
  role: OrgStaffRole | "all";
  section: OrgStaffMember["section"] | "all";
};

export const DEFAULT_ORG_STAFF_FILTERS: OrgStaffFilters = {
  query: "",
  role: "all",
  section: "all",
};

export function getOrgStaff(): OrgStaffMember[] {
  return seedIfEmpty(ORG_STAFF_KEY, DEFAULT_ORG_STAFF);
}

export function filterOrgStaff(
  staff: OrgStaffMember[],
  filters: OrgStaffFilters,
): OrgStaffMember[] {
  const query = filters.query.trim().toLowerCase();

  return staff.filter((member) => {
    if (filters.section !== "all" && member.section !== filters.section) {
      return false;
    }
    if (filters.role !== "all" && member.role !== filters.role) return false;
    if (!query) return true;

    return (
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query) ||
      member.assignedClubs.some((club) => club.toLowerCase().includes(query))
    );
  });
}

export function getOrgStaffBySection(staff: OrgStaffMember[]) {
  return {
    headOffice: staff.filter((m) => m.section === "head_office"),
    franchisee: staff.filter((m) => m.section === "franchisee"),
    pending: staff.filter((m) => m.section === "pending"),
  };
}

export function resendOrgStaffInvite(memberId: string): void {
  if (!isBrowser()) return;
  // Stub — no-op for demo
  void memberId;
}

export function removeOrgStaffMember(memberId: string): void {
  if (!isBrowser()) return;
  const staff = getOrgStaff().filter((m) => m.id !== memberId);
  localStorage.setItem(ORG_STAFF_KEY, JSON.stringify(staff));
}

export function changeOrgStaffRole(
  memberId: string,
  role: OrgStaffRole,
): void {
  if (!isBrowser()) return;
  const staff = getOrgStaff();
  const index = staff.findIndex((m) => m.id === memberId);
  if (index === -1) return;
  staff[index] = { ...staff[index], role };
  localStorage.setItem(ORG_STAFF_KEY, JSON.stringify(staff));
}
