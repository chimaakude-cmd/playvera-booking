import { NextRequest, NextResponse } from "next/server";
import {
  requirePlatformSettingsReadActor,
  requirePlatformSettingsWriteActor,
} from "@/lib/admin-users/api-auth";
import {
  getServerPlatformSettings,
  PlatformSettingsStoreError,
  resetServerPlatformSettings,
  updateServerPlatformSettings,
} from "@/lib/platform-settings/server-store";
import type { PlatformSettingsUpdate } from "@/lib/platform-settings/types";
import { validatePlatformFeeMatrix } from "@/lib/fee-settings";

function storeErrorResponse(error: unknown, fallback: string) {
  if (error instanceof PlatformSettingsStoreError) {
    const status = error.code === "not_configured" ? 503 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  console.error("[Platform settings] API error:", error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export async function GET(request: NextRequest) {
  const auth = await requirePlatformSettingsReadActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const settings = await getServerPlatformSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    return storeErrorResponse(error, "Failed to load platform settings.");
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requirePlatformSettingsWriteActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await request.json()) as PlatformSettingsUpdate & {
      reset?: boolean;
    };

    if (body.reset) {
      const settings = await resetServerPlatformSettings(auth.actor.adminId);
      return NextResponse.json({ settings });
    }

    if (
      body.defaultFees !== undefined &&
      !validatePlatformFeeMatrix(body.defaultFees)
    ) {
      return NextResponse.json(
        { error: "Invalid platform fee matrix." },
        { status: 400 },
      );
    }

    const { reset: _reset, ...update } = body;
    const settings = await updateServerPlatformSettings(
      update,
      auth.actor.adminId,
    );
    return NextResponse.json({ settings });
  } catch (error) {
    return storeErrorResponse(error, "Unable to save settings. Please try again.");
  }
}
