import type { ActivoraSupabaseClient } from "@/lib/supabase";
import { isPlaceholderEmail } from "@/lib/email/placeholder";
import { resolveProviderIdForAuthUser } from "@/lib/club-profile/server";
import type { ClubRole } from "./permissions";
import type { ClubTeamState, TeamInvite, TeamMember } from "./types";

type TeamMemberRow = {
  id: string;
  provider_id: string;
  auth_user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  role: ClubRole;
  status: "active" | "pending";
  is_owner: boolean;
  last_active_at: string | null;
  joined_at: string;
};

type TeamInviteRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: Exclude<ClubRole, "owner">;
  note: string;
  status: "pending" | "cancelled" | "accepted";
  invited_at: string;
};

function mapMemberRow(row: TeamMemberRow): TeamMember {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    role: row.role,
    status: row.status,
    lastActiveAt: row.last_active_at,
    isOwner: row.is_owner,
    joinedAt: row.joined_at,
  };
}

function mapInviteRow(row: TeamInviteRow): TeamInvite {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    role: row.role,
    note: row.note,
    status: row.status === "pending" ? "pending" : "cancelled",
    invitedAt: row.invited_at,
  };
}

async function repairOwnerEmailInDatabase(
  supabase: ActivoraSupabaseClient,
  providerId: string,
  authUserId: string,
  authEmail: string,
  members: TeamMemberRow[],
): Promise<TeamMemberRow[]> {
  const ownerEmail = authEmail.trim();
  if (!ownerEmail || isPlaceholderEmail(ownerEmail)) {
    return members;
  }

  const ownerRow = members.find((row) => row.is_owner || row.role === "owner");
  if (!ownerRow || !isPlaceholderEmail(ownerRow.email)) {
    return members;
  }

  const { error } = await supabase
    .from("club_team_members")
    .update({
      email: ownerEmail,
      auth_user_id: authUserId,
    })
    .eq("id", ownerRow.id)
    .eq("provider_id", providerId);

  if (error) {
    console.warn("[club-team] Could not repair placeholder owner email:", {
      providerId,
      message: error.message,
    });
    return members;
  }

  return members.map((row) =>
    row.id === ownerRow.id
      ? { ...row, email: ownerEmail, auth_user_id: authUserId }
      : row,
  );
}

export async function fetchClubTeamForAuthUser(
  supabase: ActivoraSupabaseClient,
  authUserId: string,
  authEmail: string,
): Promise<{ ok: true; state: ClubTeamState } | { ok: false; error: string }> {
  const providerId = await resolveProviderIdForAuthUser(supabase, authUserId);
  if (!providerId) {
    return { ok: false, error: "No club account found for this user." };
  }

  const { data: memberRows, error: membersError } = await supabase
    .from("club_team_members")
    .select(
      "id, provider_id, auth_user_id, first_name, last_name, email, role, status, is_owner, last_active_at, joined_at",
    )
    .eq("provider_id", providerId)
    .order("joined_at", { ascending: true });

  if (membersError) {
    return { ok: false, error: membersError.message };
  }

  const repairedRows = await repairOwnerEmailInDatabase(
    supabase,
    providerId,
    authUserId,
    authEmail,
    (memberRows ?? []) as TeamMemberRow[],
  );

  const { data: inviteRows, error: invitesError } = await supabase
    .from("club_team_invites")
    .select("id, first_name, last_name, email, role, note, status, invited_at")
    .eq("provider_id", providerId)
    .eq("status", "pending");

  if (invitesError) {
    return { ok: false, error: invitesError.message };
  }

  const members = repairedRows
    .filter((row) => !isPlaceholderEmail(row.email) || row.is_owner)
    .map(mapMemberRow);

  const ownerMember =
    members.find((member) => member.isOwner) ??
    members.find((member) => member.role === "owner");

  const currentMemberRow =
    repairedRows.find((row) => row.auth_user_id === authUserId) ??
    repairedRows.find((row) => row.is_owner);

  const invites = ((inviteRows ?? []) as TeamInviteRow[])
    .filter((row) => !isPlaceholderEmail(row.email))
    .map(mapInviteRow);

  return {
    ok: true,
    state: {
      currentUserId: currentMemberRow?.id ?? ownerMember?.id ?? authUserId,
      subscriptionPlan: "starter",
      members,
      invites,
    },
  };
}
