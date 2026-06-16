"use client";

import { useRouter } from "next/navigation";
import { loginTestAccount, type UserRole } from "@/lib/auth";

type DevQuickLoginProps = {
  accountType: Extract<UserRole, "parent" | "club" | "admin" | "organisation">;
};

const LABELS: Record<DevQuickLoginProps["accountType"], string> = {
  parent: "Login as Parent Tester",
  club: "Login as Club Tester",
  admin: "Login as Admin Tester",
  organisation: "Login as Organisation Tester",
};

const REDIRECTS: Record<DevQuickLoginProps["accountType"], string> = {
  parent: "/parent/dashboard",
  club: "/club/dashboard",
  admin: "/admin/dashboard",
  organisation: "/organisation/dashboard",
};

export function DevQuickLogin({ accountType }: DevQuickLoginProps) {
  const router = useRouter();

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  function handleQuickLogin() {
    loginTestAccount(accountType);
    router.push(REDIRECTS[accountType]);
  }

  return (
    <div className="mt-6 rounded-2xl border border-dashed border-amber-200 bg-amber-50/80 p-4">
      <p className="text-center text-xs font-medium uppercase tracking-wide text-amber-700">
        Dev only
      </p>
      <button
        type="button"
        onClick={handleQuickLogin}
        className="mt-3 w-full rounded-xl border border-amber-300 bg-white py-2.5 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100"
      >
        {LABELS[accountType]}
      </button>
    </div>
  );
}
