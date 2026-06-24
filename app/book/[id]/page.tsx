"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { LoadingState } from "@/components/club/LoadingState";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { WaitlistWizard } from "@/components/booking/WaitlistWizard";
import BookSessionPageLegacy from "./BookSessionPageLegacy";
import { isSessionSoldOut } from "@/lib/discovery/session-badge";
import {
  resolveSessionCheckoutMethods,
  sessionIsPaid,
} from "@/lib/payment-providers/availability";
import { sessionHasSubscriptionBilling } from "@/lib/session-subscriptions/types";
import { shouldUseSupabaseSessions } from "@/lib/data/config";
import {
  buildSessionLoadDiagnostics,
  logSessionLoadDiagnostics,
} from "@/lib/sessions/load-diagnostics";
import { fetchPublicSessionById } from "@/lib/sessions/public-client";
import { ClubSession, getSessionById } from "@/lib/sessions";

function BookSessionPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.id as string;
  const waitlistParam = searchParams.get("waitlist") === "1";

  const [session, setSession] = useState<ClubSession | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      setLoaded(false);

      if (shouldUseSupabaseSessions()) {
        const result = await fetchPublicSessionById(sessionId);

        if (cancelled) {
          return;
        }

        logSessionLoadDiagnostics(
          buildSessionLoadDiagnostics({
            routeId: sessionId,
            source: "supabase",
            found: Boolean(result.session),
            error: result.error,
          }),
        );

        setSession(result.session ?? null);
        setLoaded(true);
        return;
      }

      const found = getSessionById(sessionId);

      if (cancelled) {
        return;
      }

      logSessionLoadDiagnostics(
        buildSessionLoadDiagnostics({
          routeId: sessionId,
          source: "localStorage",
          found: Boolean(found),
        }),
      );

      setSession(found ?? null);
      setLoaded(true);
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (!loaded) {
    return <LoadingState message="Loading session..." />;
  }

  if (!session) {
    return <BookSessionPageLegacy session={null} loaded sessionId={sessionId} />;
  }

  const showWaitlist = waitlistParam || isSessionSoldOut(session);

  if (showWaitlist) {
    return <WaitlistWizard session={session} />;
  }

  const checkoutMethods = resolveSessionCheckoutMethods(session);
  const useStripeWizard =
    sessionIsPaid(session) &&
    (sessionHasSubscriptionBilling(session) || checkoutMethods?.stripe);

  if (useStripeWizard) {
    return (
      <div className="min-h-full bg-[#F8FAFC] px-6 py-10">
        <BookingWizard session={session} />
      </div>
    );
  }

  return <BookSessionPageLegacy session={session} loaded sessionId={sessionId} />;
}

export default function BookSessionPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading session..." />}>
      <BookSessionPageContent />
    </Suspense>
  );
}
