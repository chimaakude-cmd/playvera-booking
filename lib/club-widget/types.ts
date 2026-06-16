/**
 * Website booking widget configuration.
 *
 * Storage (today): localStorage `activora-club-widget`
 * Database: future `provider_widget_settings` table
 */

export type WidgetActivityScope = "all" | "selected" | "venue";

export type WidgetCardStyle = "soft" | "bordered" | "elevated";

export type WidgetLayout = "compact" | "full";

export type ClubWidgetSettings = {
  providerId: string;
  activityScope: WidgetActivityScope;
  selectedActivityIds: string[];
  venueId: string | null;
  upcomingOnly: boolean;
  buttonColor: string;
  cardStyle: WidgetCardStyle;
  layout: WidgetLayout;
  showProviderLogo: boolean;
  showAvailability: boolean;
  showAgeRange: boolean;
  showPoweredBy: boolean;
};
