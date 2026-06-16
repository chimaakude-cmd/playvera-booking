"use client";

import { Suspense } from "react";
import { LoadingState } from "@/components/club/LoadingState";
import { SessionsDiscoveryPage } from "@/components/discovery/SessionsDiscoveryPage";

export default function SessionsPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading activities..." />}>
      <SessionsDiscoveryPage />
    </Suspense>
  );
}
