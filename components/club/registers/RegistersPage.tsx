"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { DemoDataBadge } from "@/components/club/DemoDataBadge";
import { isClubDemoRoute } from "@/lib/club-demo-mode";
import { RegisterSessionView } from "./RegisterSessionView";
import { RegistersLandingPage } from "./RegistersLandingPage";

export function RegistersPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sessionParam = searchParams.get("session");
  const isDemoExperience = isClubDemoRoute(pathname);

  if (!sessionParam) {
    return <RegistersLandingPage />;
  }

  return (
    <div className="space-y-4">
      {isDemoExperience ? (
        <div className="flex justify-end">
          <DemoDataBadge />
        </div>
      ) : null}
      <RegisterSessionView sessionParam={sessionParam} />
    </div>
  );
}
