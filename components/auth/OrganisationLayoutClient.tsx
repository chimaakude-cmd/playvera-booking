"use client";

import { usePathname } from "next/navigation";
import { OrganisationShell } from "@/components/organisation/OrganisationShell";
import { PortalGuard } from "@/components/auth/PortalGuard";
import { isAuthExemptPath } from "@/lib/auth";

export function OrganisationLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (isAuthExemptPath(pathname, "organisation")) {
    return <>{children}</>;
  }

  return (
    <PortalGuard role="organisation">
      <OrganisationShell>{children}</OrganisationShell>
    </PortalGuard>
  );
}
