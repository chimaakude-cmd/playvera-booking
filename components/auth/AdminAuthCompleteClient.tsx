"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { writeAuthSession } from "@/lib/auth/session";
import type { AuthUser } from "@/lib/auth/types";

export function AdminAuthCompleteClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapSession() {
      try {
        const response = await fetch("/api/admin/auth/bootstrap");
        const payload = (await response.json()) as {
          ok?: boolean;
          user?: AuthUser;
          redirectTo?: string;
          error?: string;
        };

        if (cancelled) {
          return;
        }

        if (!response.ok || !payload.ok || !payload.user) {
          setError(payload.error ?? "Unable to complete sign-in.");
          return;
        }

        writeAuthSession(payload.user);
        const redirectTo =
          searchParams.get("redirectTo") ?? payload.redirectTo ?? "/admin/dashboard";
        router.replace(redirectTo);
      } catch {
        if (!cancelled) {
          setError("Unable to complete sign-in. Please try again.");
        }
      }
    }

    void bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-center text-sm text-violet-200/80">
      {error ? (
        <p className="rounded-xl bg-red-950/50 px-4 py-3 text-red-300 ring-1 ring-red-500/20">
          {error}
        </p>
      ) : (
        <p>Completing sign-in…</p>
      )}
    </div>
  );
}
