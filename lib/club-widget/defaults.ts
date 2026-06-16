import type { ClubWidgetSettings } from "./types";

export const DEMO_PROVIDER_ID = "demo";

export const DEFAULT_WIDGET_SETTINGS: ClubWidgetSettings = {
  providerId: DEMO_PROVIDER_ID,
  activityScope: "all",
  selectedActivityIds: [],
  venueId: null,
  upcomingOnly: true,
  buttonColor: "#18181b",
  cardStyle: "soft",
  layout: "full",
  showProviderLogo: true,
  showAvailability: true,
  showAgeRange: true,
  showPoweredBy: true,
};
