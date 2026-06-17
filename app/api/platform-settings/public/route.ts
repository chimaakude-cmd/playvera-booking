import { NextResponse } from "next/server";
import {
  getServerPlatformPublicSettings,
  PlatformSettingsStoreError,
} from "@/lib/platform-settings/server-store";

export async function GET() {
  try {
    const settings = await getServerPlatformPublicSettings();
    return NextResponse.json(settings);
  } catch (error) {
    if (error instanceof PlatformSettingsStoreError) {
      const status = error.code === "not_configured" ? 503 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }

    console.error("[Platform settings] Public GET failed:", error);
    return NextResponse.json(
      { error: "Failed to load platform settings." },
      { status: 500 },
    );
  }
}
