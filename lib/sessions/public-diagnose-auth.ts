import type { NextRequest } from "next/server";
import { isAdminRepairEnabled } from "@/lib/admin-users/production-gates";

export function isPublicDiagnoseSecretValid(request: NextRequest): boolean {
  const secret = process.env.DEBUG_SECRET?.trim();
  if (!secret) {
    return false;
  }

  return request.nextUrl.searchParams.get("secret") === secret;
}

/** Gate for ?diagnose=1 on public session API (secret, ADMIN_REPAIR, or dev). */
export function isPublicDiagnoseAllowed(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  if (isAdminRepairEnabled()) {
    return true;
  }

  return isPublicDiagnoseSecretValid(request);
}
