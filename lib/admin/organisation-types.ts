export type ProviderOrganisationType = "club" | "franchise" | "enterprise";

export const PROVIDER_ORGANISATION_TYPES: ProviderOrganisationType[] = [
  "club",
  "franchise",
  "enterprise",
];

export const PROVIDER_ORGANISATION_TYPE_LABELS: Record<
  ProviderOrganisationType,
  string
> = {
  club: "Club",
  franchise: "Franchise",
  enterprise: "Enterprise",
};

export const PROVIDER_ORGANISATION_TAB_LABELS: Record<
  ProviderOrganisationType,
  string
> = {
  club: "Clubs",
  franchise: "Franchises",
  enterprise: "Enterprise",
};

export const PROVIDER_ORGANISATION_EMPTY_MESSAGES: Record<
  ProviderOrganisationType,
  string
> = {
  club: "No clubs yet",
  franchise: "No franchises yet",
  enterprise: "No enterprise accounts yet",
};

export function normalizeOrganisationType(
  value: string | null | undefined,
): ProviderOrganisationType {
  if (value === "franchise" || value === "enterprise") {
    return value;
  }

  return "club";
}

export function organisationDashboardHref(
  type: ProviderOrganisationType,
): string {
  if (type === "franchise" || type === "enterprise") {
    return "/organisation/dashboard";
  }

  return "/club/dashboard";
}
