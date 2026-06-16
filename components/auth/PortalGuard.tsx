"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getCurrentUser,
  getDashboardPath,
  getLoginPath,
  isAuthExemptPath,
  type UserRole,
} from "@/lib/auth";

type PortalGuardProps = {
  role: UserRole;
  children: React.ReactNode;
};

export function PortalGuard({ role, children }: PortalGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isAuthExemptPath(pathname, role)) {
      return;
    }

    const user = getCurrentUser();
    if (!user) {
      router.replace(`${getLoginPath(role)}?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (user.role !== role) {
      router.replace(getDashboardPath(user.role));
    }
  }, [pathname, role, router]);

  return <>{children}</>;
}
