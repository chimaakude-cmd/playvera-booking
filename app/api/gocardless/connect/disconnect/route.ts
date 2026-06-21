import { NextResponse } from "next/server";
import { clearProviderGoCardlessConnect } from "@/lib/gocardless/provider-persistence";

type DisconnectBody = {
  providerId?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as DisconnectBody;
  const providerId = body.providerId?.trim() || "demo-provider-1";

  await clearProviderGoCardlessConnect(providerId);

  return NextResponse.json({
    providerId,
    status: "not_connected",
  });
}
