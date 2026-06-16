"use client";

import { useEffect, useState } from "react";
import { DEMO_FRANCHISEE_PROVIDER_ID } from "./defaults";
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
};

export function getFranchiseeContext(
  providerId: string = DEMO_FRANCHISEE_PROVIDER_ID,
): FranchiseeContext {
  const franchiseeClub = getFranchiseeClubByProviderId(providerId);

  if (!franchiseeClub) {
    return {
      isManaged: false,
      organisation: null,
      franchiseeClub: null,
      policy: null,
    };
  }

  const organisation = getOrganisation();
  const policy = getPermissionPolicy();

  return {
    isManaged: true,
    organisation,
    franchiseeClub,
    policy,
  };
}

export function isFranchiseeSettingLocked(
  setting: FranchiseeEditableSetting,
  providerId: string = DEMO_FRANCHISEE_PROVIDER_ID,
): boolean {
  const context = getFranchiseeContext(providerId);
  if (!context.isManaged || !context.policy) {
    return false;
  }
  return !canFranchiseeEditSetting(setting, context.policy);
}

export function useFranchiseePolicy(
  providerId: string = DEMO_FRANCHISEE_PROVIDER_ID,
) {
  const [context, setContext] = useState<FranchiseeContext>(() => ({
    isManaged: false,
    organisation: null,
    franchiseeClub: null,
    policy: null,
  }));

  useEffect(() => {
    setContext(getFranchiseeContext(providerId));
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
