import { Suspense } from "react";
import { FranchisorLoginPage } from "@/components/auth/FranchisorLoginPage";
import { LoadingState } from "@/components/club/LoadingState";

export default function OrganisationLoginRoute() {
  return (
    <Suspense fallback={<LoadingState message="Loading…" />}>
      <FranchisorLoginPage />
    </Suspense>
  );
}
