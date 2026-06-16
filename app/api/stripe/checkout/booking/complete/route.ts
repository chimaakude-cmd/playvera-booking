import { NextResponse } from "next/server";
import {
  confirmPendingBooking,
  findPendingByCheckoutSession,
  getPendingBooking,
} from "@/lib/booking-checkout/server-store";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";

export async function POST(request: Request) {
  let body: { pendingBookingId?: string; stripeSessionId?: string; mock?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const pendingId = body.pendingBookingId?.trim();
  if (!pendingId) {
    return NextResponse.json(
      { error: "pendingBookingId is required." },
      { status: 400 },
    );
  }

  const pending = getPendingBooking(pendingId);
  if (!pending) {
    return NextResponse.json(
      { error: "Pending booking not found." },
      { status: 404 },
    );
  }

  if (pending.status === "confirmed") {
    return NextResponse.json({
      confirmed: true,
      payload: pending.payload,
    });
  }

  if (body.mock || !isStripeConfigured()) {
    const confirmed = confirmPendingBooking(pendingId);
    return NextResponse.json({
      confirmed: true,
      payload: confirmed?.payload,
    });
  }

  const stripeSessionId =
    body.stripeSessionId?.trim() || pending.stripeCheckoutSessionId;
  if (!stripeSessionId) {
    return NextResponse.json(
      { error: "Stripe session id is required." },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(stripeSessionId);

  if (session.payment_status !== "paid" && session.status !== "complete") {
    return NextResponse.json(
      { error: "Payment not completed yet." },
      { status: 402 },
    );
  }

  const confirmed = confirmPendingBooking(pendingId);
  return NextResponse.json({
    confirmed: true,
    payload: confirmed?.payload,
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id")?.trim();
  const pendingId = url.searchParams.get("pending_id")?.trim();

  if (pendingId) {
    const pending = getPendingBooking(pendingId);
    if (pending?.status === "confirmed") {
      return NextResponse.json({ confirmed: true, payload: pending.payload });
    }
  }

  if (!sessionId || !isStripeConfigured()) {
    return NextResponse.json(
      { error: "session_id required." },
      { status: 400 },
    );
  }

  const pending = findPendingByCheckoutSession(sessionId);
  if (!pending) {
    return NextResponse.json(
      { error: "Pending booking not found." },
      { status: 404 },
    );
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid" && session.status !== "complete") {
    return NextResponse.json(
      { error: "Payment not completed." },
      { status: 402 },
    );
  }

  const confirmed = confirmPendingBooking(pending.id);
  return NextResponse.json({
    confirmed: true,
    payload: confirmed?.payload,
  });
}
