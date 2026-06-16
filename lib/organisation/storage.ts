import {
  DEFAULT_FRANCHISEE_CLUBS,
  DEFAULT_ORGANISATION,
  DEFAULT_ORGANISATION_USERS,
  DEFAULT_PERMISSION_POLICY,
} from "./defaults";
import type {
  FranchiseeClub,
  FranchiseeClubInput,
  Organisation,
  OrganisationPermissionPolicy,
  OrganisationUser,
} from "./types";

export const ORGANISATION_STORAGE_KEY = "activora-organisation";
export const FRANCHISEE_CLUBS_STORAGE_KEY = "activora-franchisee-clubs";
export const ORG_PERMISSION_POLICY_KEY = "activora-org-permission-policy";
export const ORG_USERS_STORAGE_KEY = "activora-org-users";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function seedIfEmpty<T>(key: string, defaults: T): T {
  if (!isBrowser()) {
    return defaults;
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw) as T;
  } catch {
    return defaults;
  }
}

function save<T>(key: string, value: T): T {
  if (isBrowser()) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore storage errors in stub
    }
  }
  return value;
}

export function getOrganisation(): Organisation {
  const stored = seedIfEmpty(ORGANISATION_STORAGE_KEY, DEFAULT_ORGANISATION);
  return {
    ...DEFAULT_ORGANISATION,
    ...stored,
    plan: { ...DEFAULT_ORGANISATION.plan, ...stored.plan },
  };
}

export function saveOrganisation(organisation: Organisation): Organisation {
  const updated = { ...organisation, updatedAt: new Date().toISOString() };
  return save(ORGANISATION_STORAGE_KEY, updated);
}

export function getOrganisationUsers(): OrganisationUser[] {
  return seedIfEmpty(ORG_USERS_STORAGE_KEY, DEFAULT_ORGANISATION_USERS);
}

export function getFranchiseeClubs(): FranchiseeClub[] {
  return seedIfEmpty(FRANCHISEE_CLUBS_STORAGE_KEY, DEFAULT_FRANCHISEE_CLUBS);
}

export function getFranchiseeClubById(id: string): FranchiseeClub | undefined {
  return getFranchiseeClubs().find((club) => club.id === id);
}

export function getFranchiseeClubByProviderId(
  providerId: string,
): FranchiseeClub | undefined {
  return getFranchiseeClubs().find((club) => club.providerId === providerId);
}

export function createFranchiseeClub(input: FranchiseeClubInput): FranchiseeClub {
  const organisation = getOrganisation();
  const now = new Date().toISOString();
  const club: FranchiseeClub = {
    id: crypto.randomUUID(),
    organisationId: organisation.id,
    providerId: `provider_${crypto.randomUUID().slice(0, 8)}`,
    name: input.name.trim(),
    area: input.area.trim(),
    managerName: input.managerName.trim(),
    managerEmail: input.managerEmail.trim(),
    status: input.status ?? "pending",
    stripeStatus: input.stripeStatus ?? "not_connected",
    bookingsCount: 0,
    revenuePence: 0,
    createdAt: now,
    updatedAt: now,
  };

  const clubs = [club, ...getFranchiseeClubs()];
  save(FRANCHISEE_CLUBS_STORAGE_KEY, clubs);
  return club;
}

export function updateFranchiseeClub(
  id: string,
  input: FranchiseeClubInput,
): FranchiseeClub {
  const clubs = getFranchiseeClubs();
  const index = clubs.findIndex((club) => club.id === id);

  if (index === -1) {
    throw new Error("Franchisee club not found.");
  }

  const updated: FranchiseeClub = {
    ...clubs[index],
    name: input.name.trim(),
    area: input.area.trim(),
    managerName: input.managerName.trim(),
    managerEmail: input.managerEmail.trim(),
    status: input.status ?? clubs[index].status,
    stripeStatus: input.stripeStatus ?? clubs[index].stripeStatus,
    updatedAt: new Date().toISOString(),
  };

  clubs[index] = updated;
  save(FRANCHISEE_CLUBS_STORAGE_KEY, clubs);
  return updated;
}

export function suspendFranchiseeClub(id: string): FranchiseeClub {
  const clubs = getFranchiseeClubs();
  const index = clubs.findIndex((club) => club.id === id);

  if (index === -1) {
    throw new Error("Franchisee club not found.");
  }

  clubs[index] = {
    ...clubs[index],
    status: "suspended",
    updatedAt: new Date().toISOString(),
  };
  save(FRANCHISEE_CLUBS_STORAGE_KEY, clubs);
  return clubs[index];
}

export function removeFranchiseeClub(id: string): void {
  const clubs = getFranchiseeClubs().filter((club) => club.id !== id);
  save(FRANCHISEE_CLUBS_STORAGE_KEY, clubs);
}

export function getPermissionPolicy(): OrganisationPermissionPolicy {
  const stored = seedIfEmpty(ORG_PERMISSION_POLICY_KEY, DEFAULT_PERMISSION_POLICY);
  return {
    ...DEFAULT_PERMISSION_POLICY,
    ...stored,
    franchiseeCanEdit: {
      ...DEFAULT_PERMISSION_POLICY.franchiseeCanEdit,
      ...stored.franchiseeCanEdit,
    },
  };
}

export function savePermissionPolicy(
  policy: OrganisationPermissionPolicy,
): OrganisationPermissionPolicy {
  const updated = { ...policy, updatedAt: new Date().toISOString() };
  return save(ORG_PERMISSION_POLICY_KEY, updated);
}

export function updatePermissionPolicy(
  franchiseeCanEdit: OrganisationPermissionPolicy["franchiseeCanEdit"],
  options?: Pick<
    OrganisationPermissionPolicy,
    "payoutScheduleControlledByFranchisor"
  >,
): OrganisationPermissionPolicy {
  const current = getPermissionPolicy();
  return savePermissionPolicy({
    ...current,
    franchiseeCanEdit,
    payoutScheduleControlledByFranchisor:
      options?.payoutScheduleControlledByFranchisor ??
      current.payoutScheduleControlledByFranchisor,
  });
}
