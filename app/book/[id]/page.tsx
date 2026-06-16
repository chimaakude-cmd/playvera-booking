"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { LoadingState } from "@/components/club/LoadingState";
import { WaitlistWizard } from "@/components/booking/WaitlistWizard";
import BookSessionPageLegacy from "./BookSessionPageLegacy";
import { isSessionSoldOut } from "@/lib/discovery/session-badge";
import { ClubSession, getSessionById } from "@/lib/sessions";

function BookSessionPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.id as string;
  const waitlistParam = searchParams.get("waitlist") === "1";

  const [session, setSession] = useState<ClubSession | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const found = getSessionById(sessionId);
    setSession(found ?? null);
    setLoaded(true);
  }, [sessionId]);

  if (!loaded) {
    return <LoadingState message="Loading session..." />;
  }

  if (!session) {
    return <BookSessionPageLegacy session={null} loaded />;
  }

  const showWaitlist = waitlistParam || isSessionSoldOut(session);

  if (showWaitlist) {
    return <WaitlistWizard session={session} />;
  }

  return <BookSessionPageLegacy session={session} loaded />;
}

export default function BookSessionPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading session..." />}>
      <BookSessionPageContent />
    </Suspense>
  );
}
