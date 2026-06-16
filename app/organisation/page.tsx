"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default function OrganisationIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    router.replace(
      user?.role === "organisation"
        ? "/organisation/dashboard"
        : "/organisation/login",
    );
  }, [router]);

  return (
    <div className="flex min-h-full items-center justify-center bg-[#f6f7f9] text-sm text-zinc-500">
      Loading organisation portal…
    </div>
  );
}
