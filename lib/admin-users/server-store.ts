import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import { generateInviteToken } from "./invite-link";
import { hashAdminPassword } from "./password";
import { canAssignAdminRole, canDisableAdminUser, canEditAdminUser } from "./permissions";
import { rowToAdminUser, rowToAuditEntry, type AdminUserAuditRow, type AdminUserRow } from "./db";
import type { AdminUser, AdminUserAuditEntry, InviteAdminUserInput, UpdateAdminUserInput } from "./types";
import { toPublicAdminUser } from "./types";

const INVITE_EXPIRY_DAYS = 7;
function nowIso(): string { return new Date().toISOString(); }
function inviteExpiresAt(): string { const expires = new Date(); expires.setDate(expires.getDate() + INVITE_EXPIRY_DAYS); return expires.toISOString(); }
function getSupabase() { if (!isSupabaseConfigured()) throw new Error("Supabase is not configured."); return createSupabaseServerClient(); }
export type AdminUserActor = { adminId: string; email: string; name: string; role: AdminUser["role"]; };
async function appendServerAuditEntry(entry: Omit<AdminUserAuditEntry, "id" | "createdAt">): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("admin_user_audit_log").insert({ action: entry.action, target_user_id: entry.targetUserId || null, target_email: entry.targetEmail, actor_id: entry.actorId, actor_name: entry.actorName, actor_email: entry.actorEmail, details: entry.details ?? null });
  if (error) throw new Error(error.message);
}
export async function getServerAdminUsers(): Promise<AdminUser[]> {
  const supabase = getSupabase(); const { data, error } = await supabase.from("admin_users").select("*").order("updated_at", { ascending: false });
  if (error) throw new Error(error.message); return (data as AdminUserRow[]).map(rowToAdminUser);
}
export async function getServerAdminUserById(id: string): Promise<AdminUser | null> {
  const supabase = getSupabase(); const { data, error } = await supabase.from("admin_users").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message); return data ? rowToAdminUser(data as AdminUserRow) : null;
}
export async function getServerAdminUserByEmail(email: string): Promise<AdminUser | null> {
  const normalized = email.trim().toLowerCase(); const supabase = getSupabase();
  const { data, error } = await supabase.from("admin_users").select("*").eq("email", normalized).maybeSingle();
  if (error) throw new Error(error.message); return data ? rowToAdminUser(data as AdminUserRow) : null;
}
export async function getServerAuditLog(): Promise<AdminUserAuditEntry[]> {
  const supabase = getSupabase(); const { data, error } = await supabase.from("admin_user_audit_log").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message); return (data as AdminUserAuditRow[]).map(rowToAuditEntry);
}
export async function createServerAdminInvite(input: InviteAdminUserInput, actor: AdminUserActor): Promise<{ user: ReturnType<typeof toPublicAdminUser>; inviteLink: string }> {
  if (!canAssignAdminRole(actor.role, input.role)) throw new Error("You do not have permission to assign this role.");
  const normalizedEmail = input.email.trim().toLowerCase(); const existing = await getServerAdminUserByEmail(normalizedEmail);
  if (existing && existing.status !== "disabled") throw new Error("An admin user with this email already exists.");
  const supabase = getSupabase();
  const { data: pendingInvite } = await supabase.from("admin_invites").select("id").eq("email", normalizedEmail).eq("status", "pending").gt("expires_at", nowIso()).maybeSingle();
  if (pendingInvite) throw new Error("An admin user with this email already exists.");
  const now = nowIso(); const inviteToken = generateInviteToken(); const expiresAt = inviteExpiresAt();
  const { data: userRow, error: userError } = await supabase.from("admin_users").insert({ name: input.name.trim(), email: normalizedEmail, role: input.role, status: "invited", email_verified: false, password_hash: null, invite_token: inviteToken, invite_sent_at: now, is_owner: false }).select("*").single();
  if (userError || !userRow) throw new Error(userError?.message ?? "Failed to create admin user.");
  const { error: inviteError } = await supabase.from("admin_invites").insert({ full_name: input.name.trim(), email: normalizedEmail, role: input.role, token: inviteToken, status: "pending", invited_by: actor.email, expires_at: expiresAt });
  if (inviteError) { await supabase.from("admin_users").delete().eq("id", userRow.id); throw new Error(inviteError.message); }
  const user = rowToAdminUser(userRow as AdminUserRow); const { buildAdminInviteLink } = await import("./invite-link"); const inviteLink = buildAdminInviteLink(inviteToken);
  await appendServerAuditEntry({ action: "invite_sent", targetUserId: user.id, targetEmail: user.email, actorId: actor.adminId, actorName: actor.name, actorEmail: actor.email, details: `Invited as ${input.role}` });
  return { user: toPublicAdminUser(user), inviteLink };
}
export async function resendServerAdminInvite(userId: string, actor: AdminUserActor): Promise<{ user: ReturnType<typeof toPublicAdminUser>; inviteLink: string }> {
  const user = await getServerAdminUserById(userId); if (!user || user.status !== "invited") throw new Error("Invited admin user not found.");
  if (!canEditAdminUser(actor.role, user)) throw new Error("You do not have permission to resend this invite.");
  const now = nowIso(); const inviteToken = generateInviteToken(); const expiresAt = inviteExpiresAt(); const supabase = getSupabase();
  const { data: userRow, error: userError } = await supabase.from("admin_users").update({ invite_token: inviteToken, invite_sent_at: now, updated_at: now }).eq("id", userId).select("*").single();
  if (userError || !userRow) throw new Error(userError?.message ?? "Failed to update admin user.");
  await supabase.from("admin_invites").update({ status: "revoked" }).eq("email", user.email).eq("status", "pending");
  const { error: inviteError } = await supabase.from("admin_invites").insert({ full_name: user.name, email: user.email, role: user.role, token: inviteToken, status: "pending", invited_by: actor.email, expires_at: expiresAt });
  if (inviteError) throw new Error(inviteError.message);
  const updated = rowToAdminUser(userRow as AdminUserRow); const { buildAdminInviteLink } = await import("./invite-link"); const inviteLink = buildAdminInviteLink(inviteToken);
  await appendServerAuditEntry({ action: "invite_resent", targetUserId: updated.id, targetEmail: updated.email, actorId: actor.adminId, actorName: actor.name, actorEmail: actor.email });
  return { user: toPublicAdminUser(updated), inviteLink };
}
export async function updateServerAdminUser(userId: string, input: UpdateAdminUserInput, actor: AdminUserActor): Promise<ReturnType<typeof toPublicAdminUser>> {
  const user = await getServerAdminUserById(userId); if (!user) throw new Error("Admin user not found.");
  if (!canEditAdminUser(actor.role, user)) throw new Error("You do not have permission to edit this admin user.");
  const now = nowIso(); const updates: Database["public"]["Tables"]["admin_users"]["Update"] = { updated_at: now };
  const auditEntries: Omit<AdminUserAuditEntry, "id" | "createdAt">[] = [];
  if (input.email && input.email.trim().toLowerCase() !== user.email) {
    const normalized = input.email.trim().toLowerCase(); const duplicate = await getServerAdminUserByEmail(normalized);
    if (duplicate && duplicate.id !== user.id && duplicate.status !== "disabled") throw new Error("An admin user with this email already exists.");
    auditEntries.push({ action: "email_changed", targetUserId: user.id, targetEmail: normalized, actorId: actor.adminId, actorName: actor.name, actorEmail: actor.email, details: `Changed from ${user.email}` }); updates.email = normalized;
  }
  if (input.name?.trim()) updates.name = input.name.trim();
  if (input.role && input.role !== user.role) {
    if (!canAssignAdminRole(actor.role, input.role)) throw new Error("You do not have permission to assign this role.");
    auditEntries.push({ action: "role_changed", targetUserId: user.id, targetEmail: user.email, actorId: actor.adminId, actorName: actor.name, actorEmail: actor.email, details: `Changed from ${user.role} to ${input.role}` }); updates.role = input.role;
  }
  if (typeof input.emailVerified === "boolean" && input.emailVerified !== user.emailVerified) {
    updates.email_verified = input.emailVerified;
    if (input.emailVerified) auditEntries.push({ action: "email_verified", targetUserId: user.id, targetEmail: user.email, actorId: actor.adminId, actorName: actor.name, actorEmail: actor.email });
  }
  if (input.password?.trim()) {
    updates.password_hash = await hashAdminPassword(input.password.trim());
    auditEntries.push({ action: "password_changed", targetUserId: user.id, targetEmail: user.email, actorId: actor.adminId, actorName: actor.name, actorEmail: actor.email });
    if (user.status === "invited") { updates.status = "active"; updates.invite_token = null; }
  }
  if (input.status && input.status !== user.status) {
    if (input.status === "disabled" && !canDisableAdminUser(actor.role, user)) throw new Error("You do not have permission to disable this admin user.");
    if (input.status === "disabled") auditEntries.push({ action: "access_disabled", targetUserId: user.id, targetEmail: user.email, actorId: actor.adminId, actorName: actor.name, actorEmail: actor.email });
    updates.status = input.status;
  }
  const supabase = getSupabase(); const { data: userRow, error } = await supabase.from("admin_users").update(updates).eq("id", userId).select("*").single();
  if (error || !userRow) throw new Error(error?.message ?? "Failed to update admin user.");
  if (input.status === "disabled") await supabase.from("admin_invites").update({ status: "revoked" }).eq("email", user.email).eq("status", "pending");
  for (const entry of auditEntries) await appendServerAuditEntry(entry);
  return toPublicAdminUser(rowToAdminUser(userRow as AdminUserRow));
}
export async function disableServerAdminUser(userId: string, actor: AdminUserActor): Promise<ReturnType<typeof toPublicAdminUser>> { return updateServerAdminUser(userId, { status: "disabled" }, actor); }
export async function getServerAdminUsersPublic(): Promise<ReturnType<typeof toPublicAdminUser>[]> { const users = await getServerAdminUsers(); return users.map(toPublicAdminUser); }
export type AcceptInviteResult = { ok: true; email: string; name: string } | { ok: false; error: string };
export async function getServerAdminInviteByToken(token: string): Promise<{ fullName: string; email: string; role: string; expiresAt: string } | null> {
  const supabase = getSupabase(); const { data, error } = await supabase.from("admin_invites").select("*").eq("token", token).eq("status", "pending").gt("expires_at", nowIso()).maybeSingle();
  if (error) throw new Error(error.message); if (!data) return null;
  return { fullName: data.full_name, email: data.email, role: data.role, expiresAt: data.expires_at };
}
export async function acceptServerAdminInvite(token: string, password: string): Promise<AcceptInviteResult> {
  if (password.trim().length < 8) return { ok: false, error: "Password must be at least 8 characters." };
  const invite = await getServerAdminInviteByToken(token); if (!invite) return { ok: false, error: "Invite link is invalid or has expired." };
  const user = await getServerAdminUserByEmail(invite.email); if (!user || user.status !== "invited") return { ok: false, error: "Admin user not found for this invite." };
  const passwordHash = await hashAdminPassword(password.trim()); const now = nowIso(); const supabase = getSupabase();
  const { error: userError } = await supabase.from("admin_users").update({ password_hash: passwordHash, status: "active", email_verified: true, invite_token: null, updated_at: now }).eq("id", user.id);
  if (userError) return { ok: false, error: userError.message };
  const { error: inviteError } = await supabase.from("admin_invites").update({ status: "accepted" }).eq("token", token);
  if (inviteError) return { ok: false, error: inviteError.message };
  await appendServerAuditEntry({ action: "password_changed", targetUserId: user.id, targetEmail: user.email, actorId: user.id, actorName: user.name, actorEmail: user.email, details: "Invite accepted — password set" });
  return { ok: true, email: user.email, name: user.name };
}
