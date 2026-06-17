import { createSupabaseServiceRoleClient, isSupabaseConfigured } from "@/lib/supabase";
import { DEFAULT_PLATFORM_SETTINGS_PAYLOAD } from "./defaults";
import {
  rowToPlatformSettingsPayload,
  updateToRowPatch,
} from "./mappers";
import type {
  PlatformPublicSettings,
  PlatformSettingsPayload,
  PlatformSettingsRow,
  PlatformSettingsUpdate,
} from "./types";
import { payloadToPublicSettings } from "./mappers";

const PLATFORM_SETTINGS_ID = 1;

export class PlatformSettingsStoreError extends Error {
  constructor(
    message: string,
    readonly code: "not_configured" | "not_found" | "database",
  ) {
    super(message);
    this.name = "PlatformSettingsStoreError";
  }
}

function seedRowFromDefaults(): Omit<PlatformSettingsRow, "created_at" | "updated_at" | "updated_by"> {
  const defaults = DEFAULT_PLATFORM_SETTINGS_PAYLOAD;
  return {
    id: PLATFORM_SETTINGS_ID,
    platform_name: defaults.platformName,
    support_email: defaults.supportEmail,
    support_phone: defaults.supportPhone,
    platform_url: defaults.platformUrl,
    default_currency: defaults.defaultCurrency,
    country: defaults.country,
    vat_threshold: defaults.vatThreshold,
    marketplace_footer_text: defaults.marketplaceFooterText,
    marketplace_enabled: defaults.marketplaceEnabled,
    ai_search_assistant_enabled: defaults.aiAssistantEnabled,
    default_fees: defaults.defaultFees,
    booking_question_defaults: defaults.bookingQuestionDefaults,
  };
}

export async function getServerPlatformSettings(): Promise<PlatformSettingsPayload> {
  if (!isSupabaseConfigured()) {
    return DEFAULT_PLATFORM_SETTINGS_PAYLOAD;
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("platform_settings")
    .select("*")
    .eq("id", PLATFORM_SETTINGS_ID)
    .maybeSingle();

  if (error) {
    throw new PlatformSettingsStoreError(error.message, "database");
  }

  if (!data) {
    const seed = seedRowFromDefaults();
    const { data: inserted, error: insertError } = await supabase
      .from("platform_settings")
      .insert(seed)
      .select("*")
      .single();

    if (insertError) {
      throw new PlatformSettingsStoreError(insertError.message, "database");
    }

    return rowToPlatformSettingsPayload(inserted as PlatformSettingsRow);
  }

  return rowToPlatformSettingsPayload(data as PlatformSettingsRow);
}

export async function getServerPlatformPublicSettings(): Promise<PlatformPublicSettings> {
  const payload = await getServerPlatformSettings();
  return payloadToPublicSettings(payload);
}

export async function updateServerPlatformSettings(
  update: PlatformSettingsUpdate,
  updatedBy: string | null,
): Promise<PlatformSettingsPayload> {
  if (!isSupabaseConfigured()) {
    throw new PlatformSettingsStoreError(
      "Supabase is not configured.",
      "not_configured",
    );
  }

  await getServerPlatformSettings();

  const supabase = createSupabaseServiceRoleClient();
  const patch = updateToRowPatch(update, updatedBy);

  const { data, error } = await supabase
    .from("platform_settings")
    .update(patch)
    .eq("id", PLATFORM_SETTINGS_ID)
    .select("*")
    .single();

  if (error) {
    throw new PlatformSettingsStoreError(error.message, "database");
  }

  return rowToPlatformSettingsPayload(data as PlatformSettingsRow);
}

export async function resetServerPlatformSettings(
  updatedBy: string | null,
): Promise<PlatformSettingsPayload> {
  const defaults = DEFAULT_PLATFORM_SETTINGS_PAYLOAD;
  return updateServerPlatformSettings(
    {
      ...defaults,
      defaultFees: defaults.defaultFees,
      bookingQuestionDefaults: defaults.bookingQuestionDefaults,
    },
    updatedBy,
  );
}
