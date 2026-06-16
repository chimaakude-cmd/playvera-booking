"use client";

import { usePathname } from "next/navigation";
import { ParentShell } from "@/components/parent/ParentShell";
import { PortalGuard } from "@/components/auth/PortalGuard";
import { isAuthExemptPath } from "@/lib/auth";

export function ParentLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isAuthExemptPath(pathname, "parent")) {
    return <>{children}</>;
  }

  return (
    <PortalGuard role="parent">
      <ParentShell>{children}</ParentShell>
    </PortalGuard>
  );
}
