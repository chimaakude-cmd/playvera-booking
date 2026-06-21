import { NextRequest, NextResponse } from "next/server";
import {
  requirePlatformSettingsReadActor,
  requirePlatformSettingsWriteActor,
} from "@/lib/admin-users/api-auth";
import {
  getServerSubscriptionPlans,
  SubscriptionPlansStoreError,
  updateServerSubscriptionPlan,
} from "@/lib/subscription-plans/server-store";
import type { PlanSlug, SubscriptionPlanUpdate } from "@/lib/subscription-plans/types";
import { normalizePlanSlug } from "@/lib/subscription-plans/defaults";

function storeErrorResponse(error: unknown, fallback: string) {
  if (error instanceof SubscriptionPlansStoreError) {
    const status = error.code === "not_configured" ? 503 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  console.error("[Subscription plans] API error:", error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export async function GET(request: NextRequest) {
  const auth = await requirePlatformSettingsReadActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const plans = await getServerSubscriptionPlans({ includeDisabled: true });
    return NextResponse.json({ plans });
  } catch (error) {
    return storeErrorResponse(error, "Failed to load subscription plans.");
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requirePlatformSettingsWriteActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await request.json()) as {
      slug: string;
      update: SubscriptionPlanUpdate;
    };

    const slug = normalizePlanSlug(body.slug) as PlanSlug;
    const plan = await updateServerSubscriptionPlan(slug, body.update ?? {});
    return NextResponse.json({ plan });
  } catch (error) {
    return storeErrorResponse(error, "Unable to save plan. Please try again.");
  }
}
