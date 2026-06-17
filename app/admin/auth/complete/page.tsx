import { Suspense } from "react";
import { AdminAuthCompleteClient } from "@/components/auth/AdminAuthCompleteClient";

export default function AdminAuthCompletePage() {
  return (
    <Suspense fallback={<p className="flex min-h-screen items-center justify-center bg-zinc-950 text-sm text-violet-200/80">Completing sign-in…</p>}>
      <AdminAuthCompleteClient />
    </Suspense>
  );
}
