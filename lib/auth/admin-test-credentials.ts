import { randomBytes, timingSafeEqual } from "node:crypto";
import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const DEFAULT_ADMIN_TEST_EMAIL = "admin-test@activora.local";

let runtimeCredentials: { email: string; password: string } | null = null;

export function generateTestAdminPassword(): string {
  return randomBytes(24).toString("base64url");
}

export function getEffectiveAdminTestEmail(): string | undefined {
  return (
    runtimeCredentials?.email ?? process.env.ADMIN_TEST_EMAIL?.trim() ?? undefined
  );
}

export function getEffectiveAdminTestPassword(): string | undefined {
  return runtimeCredentials?.password ?? process.env.ADMIN_TEST_PASSWORD;
}

export function setRuntimeTestAdminCredentials(
  email: string,
  password: string,
): void {
  runtimeCredentials = { email, password };
  process.env.ADMIN_TEST_EMAIL = email;
  process.env.ADMIN_TEST_PASSWORD = password;
}

function secretsMatch(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export function validateTestAdminCredentials(
  email: string,
  password: string,
): boolean {
  const expectedEmail = getEffectiveAdminTestEmail();
  const expectedPassword = getEffectiveAdminTestPassword();

  if (!expectedEmail || !expectedPassword) {
    return false;
  }

  return (
    email.trim().toLowerCase() === expectedEmail.toLowerCase() &&
    secretsMatch(password, expectedPassword)
  );
}

function upsertEnvVars(content: string, vars: Record<string, string>): string {
  let result = content.endsWith("\n") ? content : `${content}\n`;

  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`^${key}=.*$`, "m");
    const line = `${key}=${value}`;

    if (regex.test(result)) {
      result = result.replace(regex, line);
    } else {
      result = `${result.trimEnd()}\n${line}\n`;
    }
  }

  return result;
}

export async function upsertAdminTestCredentialsInEnvFile(
  email: string,
  password: string,
  envFilePath = path.join(process.cwd(), ".env.local"),
): Promise<boolean> {
  try {
    await access(envFilePath);
  } catch {
    return false;
  }

  const content = await readFile(envFilePath, "utf8");
  const updated = upsertEnvVars(content, {
    ADMIN_TEST_EMAIL: email,
    ADMIN_TEST_PASSWORD: password,
  });

  await writeFile(envFilePath, updated, "utf8");
  return true;
}

export function isAdminTestCredentialRegenerationAllowed(): boolean {
  return process.env.NODE_ENV !== "production";
}
