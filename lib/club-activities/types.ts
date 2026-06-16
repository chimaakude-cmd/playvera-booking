import type { ClubSession } from "@/lib/sessions";
import type { SessionVenue } from "@/lib/session-location";

export type ActivityViewTab =
  | "all"
  | "upcoming"
  | "live_now"
  | "past"
  | "draft";

export type ActivityStatus =
  | "draft"
  | "published"
  | "full"
  | "cancelled"
  | "archived";

export type ActivityWarning = "low_bookings" | "nearly_full" | "trending";

export type ActivityOccupancy = {
  filled: number;
  capacity: number;
  percent: number;
};

export type ActivityReviews = {
  rating: number;
  count: number;
};

export type ActivityRow = {
  id: string;
  session: ClubSession;
  title: string;
  imageId: string | null;
  ageRange: string;
  tags: string[];
  startDate: string | null;
  endDate: string | null;
  daysOfWeek: string[];
  occupancy: ActivityOccupancy;
  timeRange: string;
  status: ActivityStatus;
  venueName: string;
  venue: SessionVenue | null;
  reviews: ActivityReviews;
  visibility: boolean;
  warnings: ActivityWarning[];
  activityType: string;
  category: string;
};

export type ActivityFilters = {
  query: string;
  activityType: string;
  venue: string;
  ageGroup: string;
  category: string;
  visibility: "all" | "published" | "hidden";
  dayOfWeek: string;
};

export const DEFAULT_ACTIVITY_FILTERS: ActivityFilters = {
  query: "",
  activityType: "all",
  venue: "all",
  ageGroup: "all",
  category: "all",
  visibility: "all",
  dayOfWeek: "all",
};

export type ActivityMetrics = {
  activeActivities: number;
  upcomingSessions: number;
  placesBooked: number;
  occupancyPercent: number;
  revenueThisMonth: number;
};

export type SavedFilterView = {
  viewTab: ActivityViewTab;
  filters: ActivityFilters;
  savedAt: string;
};

export const ACTIVITY_VIEW_TABS: Array<{
  id: ActivityViewTab;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "live_now", label: "Live now" },
  { id: "past", label: "Past" },
  { id: "draft", label: "Draft" },
];

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  draft: "Draft",
  published: "Published",
  full: "Full",
  cancelled: "Cancelled",
  archived: "Archived",
};

export const DAY_CHIP_LABELS: Record<string, string> = {
  sunday: "Su",
  monday: "Mo",
  tuesday: "Tu",
  wednesday: "We",
  thursday: "Th",
  friday: "Fr",
  saturday: "Sa",
};

export const ALL_DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type ActivityFilterOptions = {
  activityTypes: string[];
  venues: string[];
  ageGroups: string[];
  categories: string[];
};
