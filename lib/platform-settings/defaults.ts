import { SEED_ADMIN_BOOKING_QUESTIONS } from "@/lib/admin-booking-questions";
import { DEFAULT_PLATFORM_SETTINGS } from "@/lib/admin/settings";
import { DEFAULT_PLATFORM_FEE_MATRIX } from "@/lib/fee-settings";
import type { PlatformSettingsPayload } from "./types";

export const DEFAULT_PLATFORM_SETTINGS_PAYLOAD: PlatformSettingsPayload = {
  ...DEFAULT_PLATFORM_SETTINGS,
  defaultFees: DEFAULT_PLATFORM_FEE_MATRIX,
  bookingQuestionDefaults: SEED_ADMIN_BOOKING_QUESTIONS,
};
