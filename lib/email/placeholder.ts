/** Emails that must never be shown for real club accounts. */
export function isPlaceholderEmail(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase() ?? "";
  if (!normalized) {
    return true;
  }

  if (normalized.endsWith(".example")) {
    return true;
  }

  if (normalized.includes("placeholder")) {
    return true;
  }

  if (normalized.endsWith("@example.com") || normalized.endsWith("@test.com")) {
    return true;
  }

  return false;
}

export function isRealEmail(email: string | null | undefined): boolean {
  return !isPlaceholderEmail(email);
}
