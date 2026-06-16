import { NextResponse } from "next/server";
import { generateServerReleaseDraft } from "@/lib/releases/server-store";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { baseRef?: string };
  const release = await generateServerReleaseDraft(body.baseRef);

  if (!release) {
    return NextResponse.json(
      {
        release: null,
        message: "No changes detected or auto-draft is disabled.",
      },
      { status: 200 },
    );
  }

  return NextResponse.json({ release }, { status: 201 });
}
