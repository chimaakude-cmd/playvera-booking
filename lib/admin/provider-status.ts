export type ProviderLifecycleStatus =
  | "active"
  | "incomplete"
  | "abandoned"
  | "deleted";

export type ProviderHiddenReason =
  | "missing_owner"
  | "onboarding_incomplete"
  | "missing_club_profile"
  | "deleted"
  | "abandoned"
  | "query_error";

export const PROVIDER_HIDDEN_REASON_LABELS: Record<ProviderHiddenReason, string> =
  {
    missing_owner: "Missing owner",
    onboarding_incomplete: "Onboarding incomplete",
    missing_club_profile: "Missing club profile",
    deleted: "Deleted",
    abandoned: "Abandoned",
    query_error: "Query error",
  };

export const PROVIDER_LIFECYCLE_STATUS_LABELS: Record<
  ProviderLifecycleStatus,
  string
> = {
  active: "Active",
  incomplete: "Incomplete",
  abandoned: "Abandoned",
  deleted: "Deleted",
};

export type ProviderClassificationInput = {
  authUserId: string | null;
  lifecycleStatus: ProviderLifecycleStatus | null;
  onboardingCompleted: boolean | null;
  deletedAt: string | null;
  clubProfileName: string | null;
  providerName: string | null;
  hasActiveOwner: boolean;
  loadError: string | null;
};

export type ProviderClassification = {
  lifecycleStatus: ProviderLifecycleStatus;
  hiddenReasons: ProviderHiddenReason[];
  isVisible: boolean;
};

function hasClubName(input: ProviderClassificationInput): boolean {
  const profileName = input.clubProfileName?.trim();
  if (profileName) {
    return true;
  }

  return Boolean(input.providerName?.trim());
}

function hasOwner(input: ProviderClassificationInput): boolean {
  return Boolean(input.authUserId) || input.hasActiveOwner;
}

export function classifyProvider(
  input: ProviderClassificationInput,
): ProviderClassification {
  const hiddenReasons: ProviderHiddenReason[] = [];

  if (input.loadError) {
    hiddenReasons.push("query_error");
  }

  if (input.lifecycleStatus === "deleted" || input.deletedAt) {
    hiddenReasons.push("deleted");
  }

  if (input.lifecycleStatus === "abandoned") {
    hiddenReasons.push("abandoned");
  }

  if (!hasClubName(input)) {
    hiddenReasons.push("missing_club_profile");
  }

  if (!hasOwner(input)) {
    hiddenReasons.push("missing_owner");
  }

  if (input.onboardingCompleted !== true) {
    hiddenReasons.push("onboarding_incomplete");
  }

  let lifecycleStatus: ProviderLifecycleStatus;

  if (input.lifecycleStatus === "deleted" || input.deletedAt) {
    lifecycleStatus = "deleted";
  } else if (input.lifecycleStatus === "abandoned") {
    lifecycleStatus = "abandoned";
  } else if (
    input.onboardingCompleted === true &&
    hasOwner(input) &&
    hasClubName(input) &&
    !input.loadError
  ) {
    lifecycleStatus = "active";
  } else {
    lifecycleStatus = "incomplete";
  }

  const isVisible = lifecycleStatus === "active";

  return {
    lifecycleStatus,
    hiddenReasons: [...new Set(hiddenReasons)],
    isVisible,
  };
}
