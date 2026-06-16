import { NextResponse } from "next/server";
import {
  fetchAdminProviderById,
  updateAdminProvider,
  type AdminProviderUpdatePayload,
} from "@/lib/admin/providers-data";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const provider = await fetchAdminProviderById(id);

  if (!provider) {
    return NextResponse.json({ error: "Provider not found." }, { status: 404 });
  }

  return NextResponse.json({ provider });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  let body: AdminProviderUpdatePayload;
  try {
    body = (await request.json()) as AdminProviderUpdatePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = await updateAdminProvider(id, body);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  const provider = await fetchAdminProviderById(id);
  return NextResponse.json({ provider });
}
