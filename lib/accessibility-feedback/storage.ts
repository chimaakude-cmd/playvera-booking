import type {
  AccessibilityFeedback,
  CreateAccessibilityFeedbackInput,
} from "./types";

export const ACCESSIBILITY_FEEDBACK_KEY = "activora-accessibility-feedback";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (!isBrowser()) {
    return;
  }
  localStorage.setItem(key, JSON.stringify(value));
}

export function getAccessibilityFeedback(): AccessibilityFeedback[] {
  const items = readJson<AccessibilityFeedback[]>(ACCESSIBILITY_FEEDBACK_KEY, []);
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function createAccessibilityFeedback(
  input: CreateAccessibilityFeedbackInput,
): AccessibilityFeedback {
  const items = readJson<AccessibilityFeedback[]>(ACCESSIBILITY_FEEDBACK_KEY, []);
  const feedback: AccessibilityFeedback = {
    id: createId("a11y"),
    name: input.name.trim(),
    email: input.email.trim(),
    pageUrl: input.pageUrl.trim(),
    issue: input.issue.trim(),
    createdAt: nowIso(),
  };
  writeJson(ACCESSIBILITY_FEEDBACK_KEY, [feedback, ...items]);
  return feedback;
}
