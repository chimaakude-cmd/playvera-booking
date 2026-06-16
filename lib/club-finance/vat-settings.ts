/**
 * Club VAT settings (localStorage).
 *
 * Storage key: activora-vat-settings
 * Database: future club_vat_settings table
 */

export const VAT_SETTINGS_STORAGE_KEY = "activora-vat-settings";

export const DEFAULT_VAT_RATE_PERCENT = 20;

export const UK_VAT_REGISTRATION_THRESHOLD = 90_000;
export const UK_VAT_WARNING_APPROACHING = 70_000;
export const UK_VAT_WARNING_CLOSE = 85_000;

export type VatSettings = {
  clubAccountEmail: string;
  isVatRegistered: boolean;
  vatRegistrationNumber: string;
  vatRatePercent: number;
  addVatToBookings: boolean;
};

export const DEFAULT_VAT_SETTINGS: VatSettings = {
  clubAccountEmail: "owner@playvera.example",
  isVatRegistered: false,
  vatRegistrationNumber: "",
  vatRatePercent: DEFAULT_VAT_RATE_PERCENT,
  addVatToBookings: false,
};

export type VatSettingsValidation = {
  isValid: boolean;
  errors: Partial<Record<keyof VatSettings, string>>;
};

export function getVatSettings(): VatSettings {
  if (typeof window === "undefined") {
    return DEFAULT_VAT_SETTINGS;
  }

  try {
    const raw = localStorage.getItem(VAT_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_VAT_SETTINGS;
    }

    return { ...DEFAULT_VAT_SETTINGS, ...(JSON.parse(raw) as VatSettings) };
  } catch {
    return DEFAULT_VAT_SETTINGS;
  }
}

export function saveVatSettings(settings: VatSettings): void {
  localStorage.setItem(VAT_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function validateVatSettings(settings: VatSettings): VatSettingsValidation {
  const errors: Partial<Record<keyof VatSettings, string>> = {};

  if (!settings.clubAccountEmail.trim()) {
    errors.clubAccountEmail = "Club account email is required.";
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.clubAccountEmail.trim())
  ) {
    errors.clubAccountEmail = "Enter a valid email address.";
  }

  if (settings.isVatRegistered) {
    if (!settings.vatRegistrationNumber.trim()) {
      errors.vatRegistrationNumber =
        "VAT registration number is required when VAT registered.";
    }
    if (settings.vatRatePercent <= 0 || settings.vatRatePercent > 100) {
      errors.vatRatePercent = "Enter a valid VAT rate between 0 and 100.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function isVatChargeable(settings: VatSettings): boolean {
  return settings.isVatRegistered && settings.addVatToBookings;
}
