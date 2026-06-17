import { NextRequest, NextResponse } from "next/server";
import { sendActivityRemovalEmail } from "@/lib/admin/activity-removal-email";
import {
  fetchAdminActivityById,
  fetchProviderRemovalContact,
  parseActivityRemovalReason,
  removeAdminActivity,
} from "@/lib/admin/activities-data";
import { requireManageActivitiesActor } from "@/lib/admin-users/api-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type RemoveActivityBody = {
  removalReason?: unknown;
  removalNotes?: unknown;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = requireManageActivitiesActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  let body: RemoveActivityBody = {};
  try {
    body = (await request.json()) as RemoveActivityBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const removalReason = parseActivityRemovalReason(body.removalReason);
  if (!removalReason) {
    return NextResponse.json(
      { error: "A valid removal reason is required." },
      { status: 400 },
    );
  }

  const removalNotes =
    typeof body.removalNotes === "string" ? body.removalNotes : null;

  const existing = await fetchAdminActivityById(id);
  if (!existing) {
    return NextResponse.json({ error: "Activity not found." }, { status: 404 });
  }

  const result = await removeAdminActivity(id, {
    removalReason,
    removalNotes,
    actorId: auth.actor.adminId,
  });

  if (!result.ok) {
    const status = result.error === "Activity not found." ? 404 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  const contact = await fetchProviderRemovalContact(existing.providerId);
  if (!contact) {
    return NextResponse.json({
      ok: true,
      emailWarning:
        "Activity removed, but no provider email was found for notification.",
    });
  }

  const emailResult = await sendActivityRemovalEmail({
    providerEmail: contact.email,
    providerName: contact.providerName,
    activityTitle: existing.title,
    removalReason,
    removalNotes,
  });

  if (!emailResult.ok) {
    return NextResponse.json({
      ok: true,
      emailWarning:
        "Activity removed, but the provider notification email failed to send.",
    });
  }

  if (!emailResult.sent) {
    return NextResponse.json({
      ok: true,
      emailNotice: emailResult.notice,
    });
  }

  return NextResponse.json({ ok: true });
}
