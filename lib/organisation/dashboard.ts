import {
  DEFAULT_ORG_ACTIVITY_FEED,
  DEFAULT_ORG_DASHBOARD_STATS,
  DEFAULT_ORG_NOTIFICATIONS,
} from "./defaults";
import { getFranchiseeClubs, getOrganisation } from "./storage";
import type {
  FranchiseeClub,
  Organisation,
  OrganisationActivityItem,
  OrganisationDashboardStats,
  OrganisationNotificationItem,
} from "./types";

export type OrganisationDashboardData = {
  organisation: Organisation;
  clubs: FranchiseeClub[];
  stats: OrganisationDashboardStats & {
    franchiseeCount: number;
    activeFranchisees: number;
    totalBookings: number;
    totalRevenuePence: number;
  };
  activity: OrganisationActivityItem[];
  notifications: OrganisationNotificationItem[];
};

export function getOrganisationDashboardData(): OrganisationDashboardData {
  const organisation = getOrganisation();
  const clubs = getFranchiseeClubs();
  const activeFranchisees = clubs.filter((club) => club.status === "active").length;
  const totalBookings = clubs.reduce((sum, club) => sum + club.bookingsCount, 0);
  const totalRevenuePence = clubs.reduce(
    (sum, club) => sum + club.revenuePence,
    0,
  );

  return {
    organisation,
    clubs,
    stats: {
      ...DEFAULT_ORG_DASHBOARD_STATS,
      franchiseeCount: clubs.length,
      activeFranchisees,
      totalBookings,
      totalRevenuePence,
    },
    activity: DEFAULT_ORG_ACTIVITY_FEED,
    notifications: DEFAULT_ORG_NOTIFICATIONS,
  };
}
