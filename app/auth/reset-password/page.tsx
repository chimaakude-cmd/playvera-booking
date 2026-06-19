"use client";

import { Suspense } from "react";
import { ResetPasswordPage } from "@/components/auth/ResetPasswordPage";
import { LoadingState } from "@/components/club/LoadingState";

export default function ResetPasswordRoute() {
  return (
    <Suspense fallback={<LoadingState message="Loading…" />}>
      <ResetPasswordPage />
    </Suspense>
  );
}
