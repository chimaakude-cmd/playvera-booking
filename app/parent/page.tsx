"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default function ParentIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    router.replace(
      user?.role === "parent" ? "/parent/dashboard" : "/parent/login",
    );
  }, [router]);

  return (
    <div className="flex min-h-full items-center justify-center bg-zinc-50 text-sm text-zinc-500">
      Loading parent portal…
    </div>
  );
}
