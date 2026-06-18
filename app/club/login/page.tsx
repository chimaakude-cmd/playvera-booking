import { Suspense } from "react";
import { ClubLoginPage } from "@/components/auth/ClubLoginPage";
import { LoadingState } from "@/components/club/LoadingState";

export default function ClubLoginRoute() {
  return (
    <Suspense fallback={<LoadingState message="Loading…" />}>
      <ClubLoginPage />
    </Suspense>
  );
}
