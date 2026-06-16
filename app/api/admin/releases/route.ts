import { NextResponse } from "next/server";
import {
  createServerRelease,
  getServerReleases,
  updateServerReleaseSettings,
} from "@/lib/releases/server-store";
import type { CreateReleaseInput } from "@/lib/releases/types";

export async function GET() {
  const releases = await getServerReleases();
  return NextResponse.json({ releases });
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateReleaseInput;
  const release = await createServerRelease(body);
  return NextResponse.json({ release }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    autoGenerateReleaseNotes?: boolean;
    autoDraftOnDeploy?: boolean;
  };
  const settings = await updateServerReleaseSettings(body);
  return NextResponse.json({ settings });
}
