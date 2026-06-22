import { NextResponse } from "next/server";
import {
  startGoCardlessConnect,
} from "@/lib/gocardless/connect-start";

type OnboardBody = {
  providerId?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as OnboardBody;
  const result = await startGoCardlessConnect(request, body.providerId);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message, code: result.reason },
      { status: result.reason === "not_configured" ? 503 : 400 },
    );
  }

  return NextResponse.json({
    url: result.url,
    providerId: result.providerId,
    mock: false,
  });
}
