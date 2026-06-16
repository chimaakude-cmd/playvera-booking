export function isDataUrl(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith("data:");
}

export function isPersistableImageUrl(
  value: string | null | undefined,
): value is string {
  if (typeof value !== "string" || isDataUrl(value)) {
    return false;
  }
  return value.startsWith("http://") || value.startsWith("https://");
}

/** Keep only http(s) URLs — omit base64/data URLs from persisted storage. */
export function toPersistableImageUrl(
  value: string | null | undefined,
): string | null {
  return isPersistableImageUrl(value) ? value : null;
}
