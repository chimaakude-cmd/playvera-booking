"use client";

import { usePathname } from "next/navigation";
import { ClubShell } from "@/components/club/ClubShell";
import { PortalGuard } from "@/components/auth/PortalGuard";
import { isAuthExemptPath } from "@/lib/auth";

export function ClubLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isAuthExemptPath(pathname, "club")) {
    return <>{children}</>;
  }

  return (
    <PortalGuard role="club">
      <ClubShell>{children}</ClubShell>
    </PortalGuard>
  );
}
