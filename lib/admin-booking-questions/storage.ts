import { SEED_ADMIN_BOOKING_QUESTIONS, type AdminBookingQuestion } from "./defaults";
import { getCachedBookingQuestionDefaults } from "@/lib/platform-settings/client-cache";

export function getAdminBookingQuestions(): AdminBookingQuestion[] {
  const questions =
    getCachedBookingQuestionDefaults() ?? SEED_ADMIN_BOOKING_QUESTIONS;
  return [...questions].sort((a, b) => a.sortOrder - b.sortOrder);
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
