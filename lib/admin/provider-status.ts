export type ProviderLifecycleStatus =
  | "active"
  | "incomplete"
  | "abandoned"
  | "deleted";

export type ProviderLifecycleTab =
  | "active"
  | "incomplete"
  | "hidden_broken"
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

export const PROVIDER_LIFECYCLE_TAB_LABELS: Record<ProviderLifecycleTab, string> =
  {
    active: "Active",
    incomplete: "Incomplete",
    hidden_broken: "Hidden / broken",
    deleted: "Deleted",
  };

const BROKEN_HIDDEN_REASONS = new Set<ProviderHiddenReason>([
  "missing_owner",
  "missing_club_profile",
  "query_error",
  "abandoned",
]);

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
  lifecycleTab: ProviderLifecycleTab;
  onboardingComplete: boolean;
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

export function isStructurallyOnboarded(
  input: ProviderClassificationInput,
): boolean {
  return (
    hasOwner(input) &&
    hasClubName(input) &&
    Boolean(input.authUserId) &&
    !input.loadError
  );
}

export function resolveProviderLifecycleTab(
  lifecycleStatus: ProviderLifecycleStatus,
  hiddenReasons: ProviderHiddenReason[],
): ProviderLifecycleTab {
  if (lifecycleStatus === "deleted") {
    return "deleted";
  }

  if (lifecycleStatus === "active") {
    return "active";
  }

  if (
    lifecycleStatus === "abandoned" ||
    hiddenReasons.some((reason) => BROKEN_HIDDEN_REASONS.has(reason))
  ) {
    return "hidden_broken";
  }

  return "incomplete";
}

export function classifyProvider(
  input: ProviderClassificationInput,
): ProviderClassification {
  const hiddenReasons: ProviderHiddenReason[] = [];
  const onboardingComplete =
    input.onboardingCompleted === true || isStructurallyOnboarded(input);

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

  if (!onboardingComplete) {
    hiddenReasons.push("onboarding_incomplete");
  }

  let lifecycleStatus: ProviderLifecycleStatus;

  if (input.lifecycleStatus === "deleted" || input.deletedAt) {
    lifecycleStatus = "deleted";
  } else if (input.lifecycleStatus === "abandoned") {
    lifecycleStatus = "abandoned";
  } else if (onboardingComplete) {
    lifecycleStatus = "active";
  } else {
    lifecycleStatus = "incomplete";
  }

  const dedupedReasons = [...new Set(hiddenReasons)];
  const lifecycleTab = resolveProviderLifecycleTab(
    lifecycleStatus,
    dedupedReasons,
  );

  return {
    lifecycleStatus,
    hiddenReasons: dedupedReasons,
    isVisible: lifecycleStatus === "active",
    lifecycleTab,
    onboardingComplete,
  };
}
