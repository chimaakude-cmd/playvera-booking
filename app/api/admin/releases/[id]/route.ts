import { NextResponse } from "next/server";
import {
  deleteServerRelease,
  getServerReleaseById,
  mergeServerReleaseIntoPrevious,
  updateServerRelease,
} from "@/lib/releases/server-store";
import type { UpdateReleaseInput } from "@/lib/releases/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const release = await getServerReleaseById(id);
  if (!release) {
    return NextResponse.json({ error: "Release not found" }, { status: 404 });
  }
  return NextResponse.json({ release });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as UpdateReleaseInput;
  const release = await updateServerRelease(id, body);
  if (!release) {
    return NextResponse.json({ error: "Release not found" }, { status: 404 });
  }
  return NextResponse.json({ release });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const deleted = await deleteServerRelease(id);
  if (!deleted) {
    return NextResponse.json({ error: "Release not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as { action?: string; internalOnly?: boolean };

  if (body.action === "publish") {
    const release = await updateServerRelease(id, {
      status: "published",
      publishedAt: new Date().toISOString(),
      releaseDate: new Date().toISOString(),
    });
    if (!release) {
      return NextResponse.json({ error: "Release not found" }, { status: 404 });
    }
    return NextResponse.json({ release });
  }

  if (body.action === "merge") {
    const release = await mergeServerReleaseIntoPrevious(id);
    if (!release) {
      return NextResponse.json({ error: "Nothing to merge into" }, { status: 400 });
    }
    return NextResponse.json({ release });
  }

  if (body.action === "unpublish") {
    const release = await updateServerRelease(id, {
      status: "draft",
      publishedAt: null,
    });
    if (!release) {
      return NextResponse.json({ error: "Release not found" }, { status: 404 });
    }
    return NextResponse.json({ release });
  }

  if (body.action === "internal") {
    const release = await updateServerRelease(id, {
      status: "internal",
      publishedAt: null,
    });
    if (!release) {
      return NextResponse.json({ error: "Release not found" }, { status: 404 });
    }
    return NextResponse.json({ release });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
