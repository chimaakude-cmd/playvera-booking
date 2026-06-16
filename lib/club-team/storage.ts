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

function createDefaultTeamState(): ClubTeamState {
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

function normalizeTeamState(raw: Partial<ClubTeamState>): ClubTeamState {
  const defaults = createDefaultTeamState();

  return {
    ...defaults,
    ...raw,
    subscriptionPlan: normalizeSubscriptionPlan(raw.subscriptionPlan),
    members: raw.members?.length ? raw.members : defaults.members,
    invites: raw.invites ?? defaults.invites,
  };
}

export function getClubTeamState(): ClubTeamState {
  if (typeof window === "undefined") {
    return createDefaultTeamState();
  }

  try {
    const raw = localStorage.getItem(CLUB_TEAM_STORAGE_KEY);
    if (!raw) {
      return createDefaultTeamState();
    }

    return normalizeTeamState(JSON.parse(raw) as Partial<ClubTeamState>);
  } catch {
    return createDefaultTeamState();
  }
}

function saveClubTeamState(state: ClubTeamState): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(CLUB_TEAM_STORAGE_KEY, JSON.stringify(state));
  }
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
  const state = getClubTeamState();
  const match = state.members.find((member) => member.role === role);

  if (match) {
    state.currentUserId = match.id;
    saveClubTeamState(state);
  }
}
