import type { AdminBookingQuestion } from "@/lib/admin-booking-questions";
import type { PlatformSettings } from "@/lib/admin/types";
import type { PlatformFeeMatrix } from "@/lib/fee-settings";

export type PlatformSettingsRow = {
  id: number;
  platform_name: string;
  support_email: string;
  support_phone: string;
  platform_url: string;
  default_currency: string;
  country: string;
  vat_threshold: number;
  marketplace_footer_text: string;
  marketplace_enabled: boolean;
  ai_search_assistant_enabled: boolean;
  default_fees: PlatformFeeMatrix;
  booking_question_defaults: AdminBookingQuestion[];
  created_at: string;
  updated_at: string;
  updated_by: string | null;
};

export type PlatformSettingsPayload = PlatformSettings & {
  defaultFees: PlatformFeeMatrix;
  bookingQuestionDefaults: AdminBookingQuestion[];
};

export type PlatformSettingsUpdate = Partial<PlatformSettingsPayload>;

export type PlatformPublicSettings = {
  platformName: string;
  marketplaceEnabled: boolean;
  marketplaceFooterText: string;
  aiSearchAssistantEnabled: boolean;
  defaultFees: PlatformFeeMatrix;
  bookingQuestionDefaults: AdminBookingQuestion[];
};
