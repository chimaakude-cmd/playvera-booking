"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export function AdminHubPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    router.replace(
      user?.role === "admin" ? "/admin/dashboard" : "/admin/login",
    );
  }, [router]);

  return (
    <div className="flex min-h-full items-center justify-center bg-[#f6f7f9] text-sm text-zinc-500">
      Loading admin portal…
    </div>
  );
}
