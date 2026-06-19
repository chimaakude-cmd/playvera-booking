"use client";

import { useEffect, useState } from "react";
import { getClubProfile } from "@/lib/club-profile";
import { DEMO_FRANCHISEE_PROVIDER_ID } from "./defaults";
import {
  fetchClubFranchiseStatusFromApi,
  type ClubFranchiseStatus,
} from "./franchise-status";
import {
  getFranchiseeClubByProviderId,
  getOrganisation,
  getPermissionPolicy,
} from "./storage";
import type {
  FranchiseeClub,
  FranchiseeEditableSetting,
  Organisation,
  OrganisationPermissionPolicy,
} from "./types";
import { canFranchiseeEditSetting, getLockedSettingMessage } from "./permissions";

export type FranchiseeContext = {
  isManaged: boolean;
  organisation: Organisation | null;
  franchiseeClub: FranchiseeClub | null;
  policy: OrganisationPermissionPolicy | null;
  franchiseStatusLoaded: boolean;
};

const EMPTY_CONTEXT: FranchiseeContext = {
  isManaged: false,
  organisation: null,
  franchiseeClub: null,
  policy: null,
  franchiseStatusLoaded: false,
};

function resolveProviderId(providerId?: string): string | undefined {
  const explicit = providerId?.trim();
  if (explicit) {
    return explicit;
  }

  if (typeof window === "undefined") {
    return undefined;
  }

  return getClubProfile().providerId?.trim() || undefined;
}

function isDemoProviderId(providerId: string | undefined): boolean {
  return providerId === DEMO_FRANCHISEE_PROVIDER_ID;
}

function buildDemoFranchiseeContext(providerId: string): FranchiseeContext {
  const franchiseeClub = getFranchiseeClubByProviderId(providerId);

  if (!franchiseeClub) {
    return { ...EMPTY_CONTEXT, franchiseStatusLoaded: true };
  }

  return {
    isManaged: true,
    organisation: getOrganisation(),
    franchiseeClub,
    policy: getPermissionPolicy(),
    franchiseStatusLoaded: true,
  };
}

function buildManagedContextFromStatus(
  status: ClubFranchiseStatus,
  providerId: string,
): FranchiseeContext {
  if (!status.isManaged || !status.franchisorId || !status.franchisorName) {
    return { ...EMPTY_CONTEXT, franchiseStatusLoaded: true };
  }

  const organisation: Organisation = {
    ...getOrganisation(),
    id: status.franchisorId,
    name: status.franchisorName,
  };

  const franchiseeClub: FranchiseeClub = {
    id: providerId,
    organisationId: status.franchisorId,
    providerId,
    name: getClubProfile().clubName,
    area: "",
    managerName: "",
    managerEmail: "",
    status: "active",
    stripeStatus: "not_connected",
    bookingsCount: 0,
    revenuePence: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    isManaged: true,
    organisation,
    franchiseeClub,
    policy: getPermissionPolicy(),
    franchiseStatusLoaded: true,
  };
}

export function getFranchiseeContext(
  providerId: string = DEMO_FRANCHISEE_PROVIDER_ID,
): FranchiseeContext {
  if (isDemoProviderId(providerId)) {
    return buildDemoFranchiseeContext(providerId);
  }

  return { ...EMPTY_CONTEXT, franchiseStatusLoaded: false };
}

export function isFranchiseeSettingLocked(
  setting: FranchiseeEditableSetting,
  providerId?: string,
): boolean {
  const context = getFranchiseeContext(providerId ?? DEMO_FRANCHISEE_PROVIDER_ID);
  if (!context.isManaged || !context.policy) {
    return false;
  }
  return !canFranchiseeEditSetting(setting, context.policy);
}

export function useFranchiseePolicy(providerId?: string) {
  const [context, setContext] = useState<FranchiseeContext>(EMPTY_CONTEXT);

  useEffect(() => {
    let cancelled = false;
    const resolvedProviderId = resolveProviderId(providerId);

    if (!resolvedProviderId) {
      setContext({ ...EMPTY_CONTEXT, franchiseStatusLoaded: true });
      return () => {
        cancelled = true;
      };
    }

    if (isDemoProviderId(resolvedProviderId)) {
      setContext(buildDemoFranchiseeContext(resolvedProviderId));
      return () => {
        cancelled = true;
      };
    }

    setContext({ ...EMPTY_CONTEXT, franchiseStatusLoaded: false });

    void fetchClubFranchiseStatusFromApi(resolvedProviderId).then((status) => {
      if (cancelled) {
        return;
      }

      setContext(
        buildManagedContextFromStatus(status, resolvedProviderId),
      );
    });

    return () => {
      cancelled = true;
    };
  }, [providerId]);

  function canEdit(setting: FranchiseeEditableSetting): boolean {
    if (!context.isManaged || !context.policy) {
      return true;
    }
    return canFranchiseeEditSetting(setting, context.policy);
  }

  function isLocked(setting: FranchiseeEditableSetting): boolean {
    return !canEdit(setting);
  }

  function isPayoutScheduleLocked(): boolean {
    if (!context.isManaged || !context.policy) {
      return false;
    }
    if (context.organisation?.franchisorControlsPayouts) {
      return true;
    }
    return context.policy.payoutScheduleControlledByFranchisor;
  }

  function getPayoutLockedMessage(): string {
    const orgName = context.organisation?.name ?? "your franchisor";
    return `Your payout schedule is controlled by ${orgName}.`;
  }

  return {
    ...context,
    canEdit,
    isLocked,
    lockedMessage: getLockedSettingMessage(),
    isPayoutScheduleLocked,
    payoutLockedMessage: getPayoutLockedMessage(),
  };
}
