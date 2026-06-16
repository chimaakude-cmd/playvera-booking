import { NextResponse } from "next/server";
import {
  generateTestAdminPassword,
  getEffectiveAdminTestEmail,
  isAdminTestCredentialRegenerationAllowed,
  setRuntimeTestAdminCredentials,
  upsertAdminTestCredentialsInEnvFile,
  DEFAULT_ADMIN_TEST_EMAIL,
} from "@/lib/auth/admin-test-credentials";
import { hasTestAdminSession } from "@/lib/auth/test-admin-session";

// TODO: Remove dev-only test credential regeneration before production launch.
export async function POST() {
  if (!isAdminTestCredentialRegenerationAllowed()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Credential regeneration is disabled in production. Set ADMIN_TEST_PASSWORD in Vercel env vars manually.",
      },
      { status: 403 },
    );
  }

  if (!(await hasTestAdminSession())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const email =
    getEffectiveAdminTestEmail()?.trim() ||
    process.env.ADMIN_TEST_EMAIL?.trim() ||
    DEFAULT_ADMIN_TEST_EMAIL;
  const password = generateTestAdminPassword();

  setRuntimeTestAdminCredentials(email, password);
  const wroteEnvFile = await upsertAdminTestCredentialsInEnvFile(email, password);

  return NextResponse.json({
    ok: true,
    email,
    password,
    wroteEnvFile,
    note: wroteEnvFile
      ? "Password updated in .env.local for this machine. Save it now — it will not be shown again."
      : "Password updated in memory only. On Vercel, set ADMIN_TEST_PASSWORD in project env vars for persistence across deploys.",
  });
}
