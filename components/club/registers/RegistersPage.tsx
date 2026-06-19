"use client";

import { useSearchParams } from "next/navigation";
import { RegisterSessionView } from "./RegisterSessionView";
import { RegistersLandingPage } from "./RegistersLandingPage";

export function RegistersPage() {
  const searchParams = useSearchParams();
  const sessionParam = searchParams.get("session");

  if (!sessionParam) {
    return <RegistersLandingPage />;
  }

  return <RegisterSessionView sessionParam={sessionParam} />;
}
