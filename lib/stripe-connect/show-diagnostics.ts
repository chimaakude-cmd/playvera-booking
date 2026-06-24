"use client";

import { readAuthSession } from "@/lib/auth/session";

/**
 * Stripe technical diagnostics are for admins, internal support, and dev builds only.
 */
export function showStripeDiagnostics(): boolean {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  const session = readAuthSession();
  if (!session) {
    return false;
  }

  if (session.role === "admin") {
    return true;
  }

  if (session.adminRole === "support_admin") {
    return true;
  }

  return false;
}
