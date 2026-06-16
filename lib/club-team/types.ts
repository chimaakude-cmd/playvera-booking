import type { ClubRole } from "./permissions";
import type { PlanId } from "@/src/config/pricing";
import { getPlanLabel } from "@/src/config/pricing";

export type TeamMemberStatus = "active" | "pending";

export type TeamInviteStatus = "pending" | "cancelled";

/** @deprecated Use PlanId from @/src/config/pricing */
export type ClubSubscriptionPlan = Lowercase<PlanId>;

export type TeamMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: ClubRole;
  status: TeamMemberStatus;
  lastActiveAt: string | null;
  isOwner: boolean;
  joinedAt: string;
};

export type TeamInvite = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Exclude<ClubRole, "owner">;
  note: string;
  status: TeamInviteStatus;
  invitedAt: string;
};

export type ClubTeamState = {
  currentUserId: string;
  subscriptionPlan: ClubSubscriptionPlan;
  members: TeamMember[];
  invites: TeamInvite[];
};

export type InviteStaffInput = {
  firstName: string;
  lastName: string;
  email: string;
  role: Exclude<ClubRole, "owner">;
  note: string;
};

export const CLUB_TEAM_STORAGE_KEY = "activora-club-team";

export const SUBSCRIPTION_PLAN_LABELS: Record<ClubSubscriptionPlan, string> = {
  starter: getPlanLabel("STARTER"),
  pro: getPlanLabel("PRO"),
  franchise: getPlanLabel("FRANCHISE"),
  enterprise: getPlanLabel("ENTERPRISE"),
};

export function getMemberFullName(member: Pick<TeamMember, "firstName" | "lastName">): string {
  return [member.firstName, member.lastName].filter(Boolean).join(" ");
}

export function formatLastActive(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
