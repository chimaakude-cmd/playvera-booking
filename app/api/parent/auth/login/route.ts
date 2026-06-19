import type { NextRequest } from "next/server";
import { handlePortalLoginPost } from "@/lib/auth/portal-login-api";

export async function POST(request: NextRequest) {
  return handlePortalLoginPost(request);
}
