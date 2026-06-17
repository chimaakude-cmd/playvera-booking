"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser, getLoginPath, isAuthExemptPath } from "@/lib/auth";
import { clearAuthSession, writeAuthSession } from "@/lib/auth/session";

export function AdminPortalGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const exempt = isAuthExemptPath(pathname, "admin");
  const [ready, setReady] = useState(exempt);

  useEffect(() => {
    if (exempt) {
      setReady(true);
      return;
    }

    let cancelled = false;

    async function verifyAdminSession() {
      const user = getCurrentUser();
      if (!user || user.role !== "admin") {
        router.replace(
          `${getLoginPath("admin")}?next=${encodeURIComponent(pathname)}`,
        );
        return;
      }

      try {
        const response = await fetch("/api/admin/auth/bootstrap");
        const payload = (await response.json()) as {
          ok?: boolean;
          user?: Parameters<typeof writeAuthSession>[0];
        };

        if (cancelled) {
          return;
        }

        if (!response.ok || !payload.ok || !payload.user) {
          clearAuthSession();
          router.replace(
            `${getLoginPath("admin")}?next=${encodeURIComponent(pathname)}`,
          );
          return;
        }

        writeAuthSession(payload.user);
        setReady(true);
      } catch {
        if (!cancelled) {
          clearAuthSession();
          router.replace(
            `${getLoginPath("admin")}?next=${encodeURIComponent(pathname)}`,
          );
        }
      }
    }

    setReady(false);
    void verifyAdminSession();

    return () => {
      cancelled = true;
    };
  }, [exempt, pathname, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7f9] text-sm text-zinc-500">
        Verifying admin session…
      </div>
    );
  }

  return <>{children}</>;
}
