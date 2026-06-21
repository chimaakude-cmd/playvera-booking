import { NextRequest, NextResponse } from "next/server";
import { requireManageProvidersActor } from "@/lib/admin-users/api-auth";
import {
  markProviderAbandoned,
  markProviderDeleted,
  repairProviderById,
} from "@/lib/admin/provider-repair";

type LifecycleAction = "repair" | "abandon" | "delete";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireManageProvidersActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const providerId = id?.trim();

  if (!providerId) {
    return NextResponse.json({ error: "Provider id is required." }, { status: 400 });
  }

  let body: { action?: LifecycleAction };
  try {
    body = (await request.json()) as { action?: LifecycleAction };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const action = body.action;
  if (action !== "repair" && action !== "abandon" && action !== "delete") {
    return NextResponse.json(
      { error: "action must be repair, abandon, or delete." },
      { status: 400 },
    );
  }

  if (action === "repair") {
    const result = await repairProviderById(providerId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      providerId: result.providerId,
      repaired: result.repaired,
    });
  }

  if (action === "abandon") {
    const result = await markProviderAbandoned(providerId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ providerId: result.providerId, status: "abandoned" });
  }

  const result = await markProviderDeleted(providerId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ providerId: result.providerId, status: "deleted" });
}
