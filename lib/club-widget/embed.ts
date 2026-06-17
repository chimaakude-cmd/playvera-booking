import { resolveClientAppBaseUrl } from "@/lib/app-url";
import type { ClubWidgetSettings } from "./types";

export function getClientAppBaseUrl(): string {
  return resolveClientAppBaseUrl();
}

export function buildWidgetQueryParams(
  settings: ClubWidgetSettings,
): URLSearchParams {
  const params = new URLSearchParams();

  params.set("scope", settings.activityScope);
  if (settings.selectedActivityIds.length > 0) {
    params.set("activities", settings.selectedActivityIds.join(","));
  }
  if (settings.venueId) {
    params.set("venue", settings.venueId);
  }
  if (settings.upcomingOnly) {
    params.set("upcoming", "1");
  }
  params.set("btn", settings.buttonColor.replace("#", ""));
  params.set("card", settings.cardStyle);
  params.set("layout", settings.layout);
  if (!settings.showProviderLogo) params.set("logo", "0");
  if (!settings.showAvailability) params.set("availability", "0");
  if (!settings.showAgeRange) params.set("age", "0");
  if (!settings.showPoweredBy) params.set("powered", "0");

  return params;
}

export function getProviderEmbedUrl(
  providerId: string,
  settings?: ClubWidgetSettings,
  baseUrl?: string,
): string {
  const origin = baseUrl ?? getClientAppBaseUrl();
  const query = settings ? `?${buildWidgetQueryParams(settings).toString()}` : "";
  return `${origin}/embed/provider/${providerId}${query}`;
}

export function getActivityEmbedUrl(
  activityId: string,
  settings?: ClubWidgetSettings,
  baseUrl?: string,
): string {
  const origin = baseUrl ?? getClientAppBaseUrl();
  const query = settings ? `?${buildWidgetQueryParams(settings).toString()}` : "";
  return `${origin}/embed/activity/${activityId}${query}`;
}

export function getProviderEmbedCode(
  providerId: string,
  settings?: ClubWidgetSettings,
  baseUrl?: string,
): string {
  const src = getProviderEmbedUrl(providerId, settings, baseUrl);
  return `<iframe src="${src}" width="100%" height="700" style="border:0;border-radius:16px;" title="Book activities"></iframe>`;
}

export function getPublicBookingPageUrl(
  publicSlug: string,
  baseUrl?: string,
): string {
  const origin = baseUrl ?? getClientAppBaseUrl();
  return `${origin}/clubs/${publicSlug}`;
}

export function parseWidgetSettingsFromSearchParams(
  params: URLSearchParams,
  providerId: string,
): Partial<ClubWidgetSettings> {
  const activities = params.get("activities");
  const btn = params.get("btn");

  return {
    providerId,
    activityScope:
      params.get("scope") === "selected"
        ? "selected"
        : params.get("scope") === "venue"
          ? "venue"
          : "all",
    selectedActivityIds: activities
      ? activities.split(",").filter(Boolean)
      : undefined,
    venueId: params.get("venue") ?? undefined,
    upcomingOnly: params.get("upcoming") !== "0",
    buttonColor: btn ? `#${btn}` : undefined,
    cardStyle:
      params.get("card") === "bordered"
        ? "bordered"
        : params.get("card") === "elevated"
          ? "elevated"
          : undefined,
    layout: params.get("layout") === "compact" ? "compact" : undefined,
    showProviderLogo: params.get("logo") !== "0",
    showAvailability: params.get("availability") !== "0",
    showAgeRange: params.get("age") !== "0",
    showPoweredBy: params.get("powered") !== "0",
  };
}
