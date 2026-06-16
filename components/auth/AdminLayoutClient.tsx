"use client";

import { usePathname } from "next/navigation";
import { PortalGuard } from "@/components/auth/PortalGuard";
import { isAuthExemptPath } from "@/lib/auth";

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isAuthExemptPath(pathname, "admin")) {
    return <>{children}</>;
  }

  return <PortalGuard role="admin">{children}</PortalGuard>;
}
