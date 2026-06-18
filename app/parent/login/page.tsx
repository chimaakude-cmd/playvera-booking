import { Suspense } from "react";
import { ParentLoginPage } from "@/components/auth/ParentLoginPage";
import { LoadingState } from "@/components/club/LoadingState";

export default function ParentLoginRoute() {
  return (
    <Suspense fallback={<LoadingState message="Loading…" />}>
      <ParentLoginPage />
    </Suspense>
  );
}
