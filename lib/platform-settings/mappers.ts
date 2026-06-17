import { SEED_ADMIN_BOOKING_QUESTIONS } from "@/lib/admin-booking-questions/defaults";
import type { AdminBookingQuestion } from "@/lib/admin-booking-questions/defaults";
import {
  DEFAULT_PLATFORM_FEE_MATRIX,
  validatePlatformFeeMatrix,
  type PlatformFeeMatrix,
} from "@/lib/fee-settings";
import type {
  PlatformPublicSettings,
  PlatformSettingsPayload,
  PlatformSettingsRow,
  PlatformSettingsUpdate,
} from "./types";

function normalizeFeeMatrix(value: unknown): PlatformFeeMatrix {
  if (validatePlatformFeeMatrix(value as Partial<PlatformFeeMatrix>)) {
    return value as PlatformFeeMatrix;
  }
  return DEFAULT_PLATFORM_FEE_MATRIX;
}

function normalizeBookingQuestions(value: unknown): AdminBookingQuestion[] {
  if (Array.isArray(value) && value.length > 0) {
    return value as AdminBookingQuestion[];
  }
  return SEED_ADMIN_BOOKING_QUESTIONS;
}

export function rowToPlatformSettingsPayload(
  row: PlatformSettingsRow,
): PlatformSettingsPayload {
  return {
    platformName: row.platform_name,
    supportEmail: row.support_email,
    supportPhone: row.support_phone,
    platformUrl: row.platform_url,
    defaultCurrency: row.default_currency,
    country: row.country,
    vatThreshold: Number(row.vat_threshold),
    marketplaceFooterText: row.marketplace_footer_text,
    marketplaceEnabled: row.marketplace_enabled,
    aiAssistantEnabled: row.ai_search_assistant_enabled,
    defaultFees: normalizeFeeMatrix(row.default_fees),
    bookingQuestionDefaults: normalizeBookingQuestions(
      row.booking_question_defaults,
    ),
  };
}

export function payloadToPublicSettings(
  payload: PlatformSettingsPayload,
): PlatformPublicSettings {
  return {
    platformName: payload.platformName,
    marketplaceEnabled: payload.marketplaceEnabled,
    marketplaceFooterText: payload.marketplaceFooterText,
    aiSearchAssistantEnabled: payload.aiAssistantEnabled,
    defaultFees: payload.defaultFees,
    bookingQuestionDefaults: payload.bookingQuestionDefaults,
  };
}

export function updateToRowPatch(
  update: PlatformSettingsUpdate,
  updatedBy: string | null,
): Partial<PlatformSettingsRow> {
  const patch: Partial<PlatformSettingsRow> = { updated_by: updatedBy };

  if (update.platformName !== undefined) {
    patch.platform_name = update.platformName;
  }
  if (update.supportEmail !== undefined) {
    patch.support_email = update.supportEmail;
  }
  if (update.supportPhone !== undefined) {
    patch.support_phone = update.supportPhone;
  }
  if (update.platformUrl !== undefined) {
    patch.platform_url = update.platformUrl;
  }
  if (update.defaultCurrency !== undefined) {
    patch.default_currency = update.defaultCurrency;
  }
  if (update.country !== undefined) {
    patch.country = update.country;
  }
  if (update.vatThreshold !== undefined) {
    patch.vat_threshold = update.vatThreshold;
  }
  if (update.marketplaceFooterText !== undefined) {
    patch.marketplace_footer_text = update.marketplaceFooterText;
  }
  if (update.marketplaceEnabled !== undefined) {
    patch.marketplace_enabled = update.marketplaceEnabled;
  }
  if (update.aiAssistantEnabled !== undefined) {
    patch.ai_search_assistant_enabled = update.aiAssistantEnabled;
  }
  if (update.defaultFees !== undefined) {
    patch.default_fees = update.defaultFees;
  }
  if (update.bookingQuestionDefaults !== undefined) {
    patch.booking_question_defaults = update.bookingQuestionDefaults;
  }

  return patch;
}
