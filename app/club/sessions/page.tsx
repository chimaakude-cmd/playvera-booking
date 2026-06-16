"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ActivitiesPage } from "@/components/club/activities/ActivitiesPage";
import { LoadingState } from "@/components/club/LoadingState";

function ClubActivitiesContent() {
  const searchParams = useSearchParams();
  const [showUpdated, setShowUpdated] = useState(false);
  const [showCreated, setShowCreated] = useState(false);

  useEffect(() => {
    if (searchParams.get("updated") === "1") {
      setShowUpdated(true);
      window.history.replaceState({}, "", "/club/sessions");
    }

    if (searchParams.get("created") === "1") {
      setShowCreated(true);
      window.history.replaceState({}, "", "/club/sessions");
    }
  }, [searchParams]);

  return (
    <ActivitiesPage
      showCreated={showCreated}
      showUpdated={showUpdated}
    />
  );
}

export default function ClubSessionsPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading activities..." />}>
      <ClubActivitiesContent />
    </Suspense>
  );
}
