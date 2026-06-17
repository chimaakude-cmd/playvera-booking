import { NextRequest, NextResponse } from "next/server";
import { requireManageActivitiesActor } from "@/lib/admin-users/api-auth";
import {
  deleteAdminActivity,
  fetchAdminActivityById,
  updateAdminActivity,
  type AdminActivityUpdatePayload,
} from "@/lib/admin/activities-data";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = requireManageActivitiesActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  let body: AdminActivityUpdatePayload;
  try {
    body = (await request.json()) as AdminActivityUpdatePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = await updateAdminActivity(id, body);

  if (!result.ok) {
    const status = result.error === "Activity not found." ? 404 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ activity: result.activity });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = requireManageActivitiesActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  const existing = await fetchAdminActivityById(id);
  if (!existing) {
    return NextResponse.json({ error: "Activity not found." }, { status: 404 });
  }

  const result = await deleteAdminActivity(id);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
