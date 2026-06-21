import {
  UK_VAT_REGISTRATION_THRESHOLD,
  UK_VAT_WARNING_APPROACHING,
} from "./vat-settings";

export type VatThresholdStatus = "below" | "approaching" | "over";

export type AdminVatFlag =
  | "approaching_vat_threshold"
  | "over_vat_threshold"
  | "vat_number_missing";

export const ADMIN_VAT_FLAG_LABELS: Record<AdminVatFlag, string> = {
  approaching_vat_threshold: "Approaching VAT threshold",
  over_vat_threshold: "Over VAT threshold",
  vat_number_missing: "VAT number missing",
};

export function getVatThresholdStatus(
  rollingTwelveMonthRevenue: number,
): VatThresholdStatus {
  if (rollingTwelveMonthRevenue >= UK_VAT_REGISTRATION_THRESHOLD) {
    return "over";
  }

  if (rollingTwelveMonthRevenue >= UK_VAT_WARNING_APPROACHING) {
    return "approaching";
  }

  return "below";
}

/** Show VAT setup checklist task when turnover is near the registration threshold. */
export function shouldShowVatSetupTask(rollingTwelveMonthRevenue: number): boolean {
  return rollingTwelveMonthRevenue >= UK_VAT_WARNING_APPROACHING;
}

export function getAdminVatFlags(
  rollingTwelveMonthRevenue: number,
  hasVatNumber: boolean,
): AdminVatFlag[] {
  const status = getVatThresholdStatus(rollingTwelveMonthRevenue);
  const flags: AdminVatFlag[] = [];

  if (status === "approaching") {
    flags.push("approaching_vat_threshold");
  }

  if (status === "over") {
    flags.push("over_vat_threshold");
    if (!hasVatNumber) {
      flags.push("vat_number_missing");
    }
  }

  return flags;
}
