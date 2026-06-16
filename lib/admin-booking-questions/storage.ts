import {
  ADMIN_BOOKING_QUESTIONS_KEY,
  SEED_ADMIN_BOOKING_QUESTIONS,
  type AdminBookingQuestion,
} from "./defaults";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readJson<T>(fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }
  try {
    const raw = localStorage.getItem(ADMIN_BOOKING_QUESTIONS_KEY);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(value: AdminBookingQuestion[]): void {
  if (!isBrowser()) {
    return;
  }
  localStorage.setItem(ADMIN_BOOKING_QUESTIONS_KEY, JSON.stringify(value));
}

export function getAdminBookingQuestions(): AdminBookingQuestion[] {
  const questions = readJson(SEED_ADMIN_BOOKING_QUESTIONS);
  return [...questions].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function saveAdminBookingQuestions(
  questions: AdminBookingQuestion[],
): void {
  writeJson(questions);
}

export function addAdminBookingQuestion(
  input: Omit<AdminBookingQuestion, "id" | "sortOrder"> & {
    sortOrder?: number;
  },
): AdminBookingQuestion {
  const questions = getAdminBookingQuestions();
  const maxOrder = questions.reduce((max, q) => Math.max(max, q.sortOrder), 0);
  const question: AdminBookingQuestion = {
    ...input,
    id: `admin-custom-${crypto.randomUUID().slice(0, 8)}`,
    sortOrder: input.sortOrder ?? maxOrder + 1,
  };
  saveAdminBookingQuestions([...questions, question]);
  return question;
}

export function updateAdminBookingQuestion(
  id: string,
  patch: Partial<AdminBookingQuestion>,
): void {
  saveAdminBookingQuestions(
    getAdminBookingQuestions().map((q) =>
      q.id === id ? { ...q, ...patch } : q,
    ),
  );
}

export function reorderAdminBookingQuestions(ids: string[]): void {
  const map = new Map(getAdminBookingQuestions().map((q) => [q.id, q]));
  const reordered = ids
    .map((id, index) => {
      const question = map.get(id);
      return question ? { ...question, sortOrder: index + 1 } : null;
    })
    .filter((q): q is AdminBookingQuestion => q !== null);
  const remaining = getAdminBookingQuestions().filter((q) => !ids.includes(q.id));
  saveAdminBookingQuestions([...reordered, ...remaining]);
}

export function resetAdminBookingQuestions(): AdminBookingQuestion[] {
  const defaults = SEED_ADMIN_BOOKING_QUESTIONS.map((q) => ({ ...q }));
  saveAdminBookingQuestions(defaults);
  return defaults;
}

export function adminQuestionsToClubConfig(): import("@/lib/booking-questions").BookingQuestionConfig[] {
  return getAdminBookingQuestions().map((q) => ({
    id: q.id,
    key: q.key,
    label: q.label,
    answerType: q.answerType,
    required: q.required,
    showOnRegister: q.showOnRegister,
    enabled: q.enabled,
    isCustom: false,
  }));
}
