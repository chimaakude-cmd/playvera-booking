import { NextResponse } from "next/server";
import { buildPendingBookingPayload } from "@/lib/booking-checkout/build-payload";
import { buildDetailsAnswers } from "@/lib/booking-checkout/build-payload";
import { buildBookingAnswersFromForm } from "@/lib/booking-questions";
import type { BookingDetailsForm } from "@/lib/booking-flow/types";
import type { BookingQuestionConfig } from "@/lib/booking-questions";
import { isSessionSoldOut } from "@/lib/discovery/session-badge";
import { getAppBaseUrl } from "@/lib/stripe/server";
import {
  createServerWaitlistEntry,
  getServerWaitlistEntriesForSession,
  syncServerWaitlistEntry,
} from "@/lib/waitlist/server-store";
import { notifyProviderOnWaitlistJoin } from "@/lib/waitlist/queue";
import { ACTIVE_WAITLIST_STATUSES } from "@/lib/waitlist/types";
import type { NewWaitlistEntry } from "@/lib/waitlist/types";
import type { ClubSession } from "@/lib/sessions";

type JoinBody = {
  session: ClubSession;
  details: BookingDetailsForm;
  sessionQuestions: BookingQuestionConfig[];
  questionValues: Record<string, string | boolean>;
  parentId?: string | null;
  accessMode: "guest" | "parent";
};

export async function POST(request: Request) {
  let body: JoinBody;
  try {
    body = (await request.json()) as JoinBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.session?.id || !body.details?.email) {
    return NextResponse.json(
      { error: "Session and parent email are required." },
      { status: 400 },
    );
  }

  if (!isSessionSoldOut(body.session)) {
    return NextResponse.json(
      { error: "This session still has available spaces. Book directly instead." },
      { status: 400 },
    );
  }

  const sessionAnswers = buildBookingAnswersFromForm(
    body.sessionQuestions ?? [],
    body.questionValues ?? {},
  );
  const detailsAnswers = buildDetailsAnswers(body.details);
  const bookingAnswers = [...detailsAnswers, ...sessionAnswers];

  const payload = buildPendingBookingPayload({
    session: body.session,
    details: body.details,
    sessionQuestions: [],
    questionValues: {},
    pricePaid: 0,
    accessMode: body.accessMode,
  });

  const input: NewWaitlistEntry = {
    sessionId: body.session.id,
    parentId: body.parentId ?? null,
    childId: body.details.childId ?? null,
    guestBookingId: null,
    expiresAt: null,
    parentName: payload.parentName,
    email: payload.email,
    childName: payload.childName,
    childAge: payload.childAge,
    emergencyContact: payload.emergencyContact,
    emergencyContactName: payload.emergencyContactName,
    emergencyContactPhone: payload.emergencyContactPhone,
    authorizedCollectionPerson: payload.authorizedCollectionPerson,
    bookingAnswers,
    medicalConditions: payload.medicalConditions,
    allergies: payload.allergies,
    medicationNotes: payload.medicationNotes,
    photoConsentSession: payload.photoConsentSession,
    photoConsentMarketing: payload.photoConsentMarketing,
  };

  const entry = createServerWaitlistEntry(input);
  syncServerWaitlistEntry(entry);

  const waitlistCount = getServerWaitlistEntriesForSession(body.session.id).filter(
    (item) => ACTIVE_WAITLIST_STATUSES.includes(item.status),
  ).length;
  notifyProviderOnWaitlistJoin({
    session: body.session,
    isSessionFull: true,
    waitlistCount,
  });

  return NextResponse.json({
    entry,
    position: entry.position,
    waitlistCount,
    baseUrl: getAppBaseUrl(request),
  });
}
