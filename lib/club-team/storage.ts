import { isDevelopmentEnvironment } from "@/lib/admin-users/production-gates";
import { readAuthSession } from "@/lib/auth/session";
import type { AuthUser } from "@/lib/auth/types";
import { isPlaceholderEmail } from "@/lib/email/placeholder";
import {
  isRealClubAccountSession,
  resolveClubOwnerEmail,
} from "./owner-email";
import type {
  ClubTeamState,
  InviteStaffInput,
  TeamInvite,
  TeamMember,
} from "./types";
import { SUBSCRIPTION_PLAN_LABELS } from "./types";
import { CLUB_TEAM_STORAGE_KEY } from "./types";
import type { ClubRole } from "./permissions";
import { INVITABLE_ROLES } from "./permissions";

function createDemoTeamState(): ClubTeamState {
  const now = new Date().toISOString();
  const ownerId = "owner-1";

  return {
    currentUserId: ownerId,
    subscriptionPlan: "starter",
    members: [
      {
        id: ownerId,
        firstName: "Chima",
        lastName: "Akude",
        email: "owner@playvera.example",
        role: "owner",
        status: "active",
        lastActiveAt: now,
        isOwner: true,
        joinedAt: "2024-01-10T10:00:00.000Z",
      },
      {
        id: "member-2",
        firstName: "Sarah",
        lastName: "Mitchell",
        email: "sarah@playvera.example",
        role: "manager",
        status: "active",
        lastActiveAt: "2026-06-12T09:15:00.000Z",
        isOwner: false,
        joinedAt: "2025-03-04T10:00:00.000Z",
      },
      {
        id: "member-3",
        firstName: "James",
        lastName: "Okonkwo",
        email: "james@playvera.example",
        role: "coach",
        status: "active",
        lastActiveAt: "2026-06-13T16:40:00.000Z",
        isOwner: false,
        joinedAt: "2025-08-18T10:00:00.000Z",
      },
      {
        id: "member-4",
        firstName: "Emily",
        lastName: "Grant",
        email: "emily@playvera.example",
        role: "administrator",
        status: "active",
        lastActiveAt: "2026-06-10T11:20:00.000Z",
        isOwner: false,
        joinedAt: "2026-01-22T10:00:00.000Z",
      },
    ],
    invites: [
      {
        id: "invite-1",
        firstName: "Tom",
        lastName: "Baker",
        email: "tom@playvera.example",
        role: "coach",
        note: "Saturday football assistant",
        status: "pending",
        invitedAt: "2026-06-11T08:00:00.000Z",
      },
    ],
  };
}

function splitDisplayName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "Club", lastName: "Owner" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" ") || "Owner",
  };
}

export function createOwnerOnlyTeamState(options?: {
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}): ClubTeamState {
  const session = typeof window !== "undefined" ? readAuthSession() : null;
  const now = new Date().toISOString();
  const email = options?.email?.trim() || resolveClubOwnerEmail();
  const { firstName, lastName } =
    options?.firstName !== undefined
      ? {
          firstName: options.firstName.trim() || "Club",
          lastName: options.lastName?.trim() || "Owner",
        }
      : splitDisplayName(session?.name ?? "Club Owner");
  const ownerId = options?.userId ?? session?.id ?? crypto.randomUUID();

  return {
    currentUserId: ownerId,
    subscriptionPlan: "starter",
    members: [
      {
        id: ownerId,
        firstName,
        lastName,
        email,
        role: "owner",
        status: "active",
        lastActiveAt: now,
        isOwner: true,
        joinedAt: now,
      },
    ],
    invites: [],
  };
}

function createDefaultTeamState(): ClubTeamState {
  if (isRealClubAccountSession()) {
    return createOwnerOnlyTeamState();
  }

  if (isDevelopmentEnvironment()) {
    return createDemoTeamState();
  }

  return createOwnerOnlyTeamState();
}

function isSeededDemoTeamState(state: ClubTeamState): boolean {
  const hasPlaceholderMember = state.members.some(
    (member) =>
      isPlaceholderEmail(member.email) ||
      (!member.isOwner && member.id.startsWith("member-")),
  );
  const hasPlaceholderInvite = state.invites.some((invite) =>
    isPlaceholderEmail(invite.email),
  );

  return hasPlaceholderMember || hasPlaceholderInvite;
}

function normalizeSubscriptionPlan(
  value?: string,
): ClubTeamState["subscriptionPlan"] {
  const legacyMap: Record<string, ClubTeamState["subscriptionPlan"]> = {
    growth: "pro",
  };
  const normalized = (value ?? "starter").toLowerCase();
  if (normalized in SUBSCRIPTION_PLAN_LABELS) {
    return normalized as ClubTeamState["subscriptionPlan"];
  }
  return legacyMap[normalized] ?? "starter";
}

function repairOwnerMember(
  members: TeamMember[],
  realOwnerEmail: string,
): TeamMember[] {
  const session = typeof window !== "undefined" ? readAuthSession() : null;
  const { firstName, lastName } = session
    ? splitDisplayName(session.name)
    : { firstName: "Club", lastName: "Owner" };
  const ownerId = session?.id;

  const ownerIndex = members.findIndex(
    (member) => member.isOwner || member.role === "owner",
  );

  if (ownerIndex >= 0) {
    const owner = members[ownerIndex];
    if (
      isPlaceholderEmail(owner.email) ||
      (realOwnerEmail && owner.email !== realOwnerEmail)
    ) {
      const next = [...members];
      next[ownerIndex] = {
        ...owner,
        email: realOwnerEmail || owner.email,
        ...(ownerId ? { id: ownerId } : {}),
        firstName: owner.firstName || firstName,
        lastName: owner.lastName || lastName,
        status: "active",
        isOwner: true,
        role: "owner",
      };
      return next;
    }

    return members;
  }

  if (!realOwnerEmail) {
    return members;
  }

  return [createOwnerOnlyTeamState({ email: realOwnerEmail }).members[0], ...members];
}

export function repairClubTeamState(state: ClubTeamState): ClubTeamState {
  const realOwnerEmail = resolveClubOwnerEmail();
  const useRealAccountRules = isRealClubAccountSession() || !isDevelopmentEnvironment();

  let members = state.members;
  let invites = state.invites;

  if (useRealAccountRules && isSeededDemoTeamState(state)) {
    return createOwnerOnlyTeamState({
      userId: readAuthSession()?.id,
      email: realOwnerEmail,
    });
  }

  if (useRealAccountRules) {
    members = members.filter(
      (member) =>
        member.isOwner ||
        (!isPlaceholderEmail(member.email) && !member.id.startsWith("member-")),
    );
    invites = invites.filter((invite) => !isPlaceholderEmail(invite.email));
    members = repairOwnerMember(members, realOwnerEmail);
  }

  const session = typeof window !== "undefined" ? readAuthSession() : null;

  return {
    ...state,
    members,
    invites,
    currentUserId:
      session?.id ??
      members.find((member) => member.isOwner)?.id ??
      state.currentUserId,
  };
}

function normalizeTeamState(raw: Partial<ClubTeamState>): ClubTeamState {
  const defaults = createDefaultTeamState();

  const normalized: ClubTeamState = {
    ...defaults,
    ...raw,
    subscriptionPlan: normalizeSubscriptionPlan(raw.subscriptionPlan),
    members: raw.members?.length ? raw.members : defaults.members,
    invites: raw.invites ?? defaults.invites,
  };

  return repairClubTeamState(normalized);
}

function loadClubTeamState(): ClubTeamState {
  if (typeof window === "undefined") {
    return createDefaultTeamState();
  }

  try {
    const raw = localStorage.getItem(CLUB_TEAM_STORAGE_KEY);
    if (!raw) {
      return repairClubTeamState(createDefaultTeamState());
    }

    return normalizeTeamState(JSON.parse(raw) as Partial<ClubTeamState>);
  } catch {
    return repairClubTeamState(createDefaultTeamState());
  }
}

function persistIfChanged(previous: string | null, state: ClubTeamState): void {
  const serialized = JSON.stringify(state);
  if (previous !== serialized) {
    localStorage.setItem(CLUB_TEAM_STORAGE_KEY, serialized);
  }
}

export function applyClubTeamState(state: ClubTeamState): ClubTeamState {
  const repaired = repairClubTeamState(state);
  if (typeof window !== "undefined") {
    const previous = localStorage.getItem(CLUB_TEAM_STORAGE_KEY);
    persistIfChanged(previous, repaired);
  }
  return repaired;
}

export function initializeClubTeamFromOwner(
  user: Pick<AuthUser, "id" | "email" | "name">,
  options?: { firstName?: string; lastName?: string },
): ClubTeamState {
  const { firstName, lastName } =
    options?.firstName !== undefined
      ? {
          firstName: options.firstName.trim() || "Club",
          lastName: options.lastName?.trim() || "Owner",
        }
      : splitDisplayName(user.name);

  return applyClubTeamState(
    createOwnerOnlyTeamState({
      userId: user.id,
      email: user.email,
      firstName,
      lastName,
    }),
  );
}

export function getClubTeamState(): ClubTeamState {
  const state = loadClubTeamState();
  if (typeof window !== "undefined") {
    const previous = localStorage.getItem(CLUB_TEAM_STORAGE_KEY);
    persistIfChanged(previous, state);
  }
  return state;
}

function saveClubTeamState(state: ClubTeamState): void {
  applyClubTeamState(state);
}

export function getCurrentClubRole(): ClubRole {
  const state = getClubTeamState();
  const current = state.members.find((member) => member.id === state.currentUserId);
  return current?.role ?? "owner";
}

export function getCurrentTeamMember(): TeamMember | null {
  const state = getClubTeamState();
  return state.members.find((member) => member.id === state.currentUserId) ?? null;
}

export function getOwnerMember(state: ClubTeamState = getClubTeamState()): TeamMember {
  return (
    state.members.find((member) => member.isOwner) ??
    state.members.find((member) => member.role === "owner")!
  );
}

export function inviteStaffMember(input: InviteStaffInput): TeamInvite {
  const state = getClubTeamState();

  if (!INVITABLE_ROLES.includes(input.role)) {
    throw new Error("Owner role cannot be assigned via invite.");
  }

  if (isPlaceholderEmail(input.email)) {
    throw new Error("Enter a real email address for the invite.");
  }

  const invite: TeamInvite = {
    id: crypto.randomUUID(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email.trim().toLowerCase(),
    role: input.role,
    note: input.note.trim(),
    status: "pending",
    invitedAt: new Date().toISOString(),
  };

  state.invites = [invite, ...state.invites.filter((item) => item.status === "pending")];
  saveClubTeamState(state);
  return invite;
}

export function changeMemberRole(memberId: string, role: ClubRole): TeamMember {
  const state = getClubTeamState();
  const member = state.members.find((item) => item.id === memberId);

  if (!member) {
    throw new Error("Team member not found.");
  }

  if (member.isOwner) {
    throw new Error("Owner role cannot be changed.");
  }

  if (role === "owner") {
    throw new Error("Assign owner via ownership transfer in a future release.");
  }

  member.role = role;
  saveClubTeamState(state);
  return member;
}

export function removeTeamMember(memberId: string): void {
  const state = getClubTeamState();
  const member = state.members.find((item) => item.id === memberId);

  if (!member) {
    throw new Error("Team member not found.");
  }

  if (member.isOwner) {
    throw new Error("The owner cannot be removed.");
  }

  state.members = state.members.filter((item) => item.id !== memberId);
  saveClubTeamState(state);
}

export function resendTeamInvite(inviteId: string): TeamInvite {
  const state = getClubTeamState();
  const invite = state.invites.find((item) => item.id === inviteId);

  if (!invite || invite.status !== "pending") {
    throw new Error("Pending invite not found.");
  }

  invite.invitedAt = new Date().toISOString();
  saveClubTeamState(state);
  return invite;
}

export function cancelTeamInvite(inviteId: string): void {
  const state = getClubTeamState();
  const invite = state.invites.find((item) => item.id === inviteId);

  if (!invite) {
    throw new Error("Invite not found.");
  }

  invite.status = "cancelled";
  saveClubTeamState(state);
}

export function setCurrentClubRoleForDemo(role: ClubRole): void {
  if (!isDevelopmentEnvironment() || isRealClubAccountSession()) {
    return;
  }

  const state = getClubTeamState();
  const match = state.members.find((member) => member.role === role);

  if (match) {
    state.currentUserId = match.id;
    saveClubTeamState(state);
  }
}
