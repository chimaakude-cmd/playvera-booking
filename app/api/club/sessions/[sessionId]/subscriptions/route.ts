import { NextResponse } from "next/server";
import {
  cancelParentSubscription,
  getSessionSubscriptionStats,
} from "@/lib/session-subscriptions/server-store";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { sessionId } = await context.params;
  if (!sessionId?.trim()) {
    return NextResponse.json({ error: "Session id required." }, { status: 400 });
  }

  const stats = await getSessionSubscriptionStats(sessionId.trim());
  return NextResponse.json(stats);
}

export async function POST(request: Request, context: RouteContext) {
  const { sessionId } = await context.params;
  if (!sessionId?.trim()) {
    return NextResponse.json({ error: "Session id required." }, { status: 400 });
  }

  let body: { action?: string; recordId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  if (body.action !== "cancel" || !body.recordId?.trim()) {
    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 503 },
    );
  }

  const stripe = await getStripe();
  const result = await cancelParentSubscription(body.recordId.trim(), stripe);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const stats = await getSessionSubscriptionStats(sessionId.trim());
  return NextResponse.json({ canceled: true, ...stats });
}
