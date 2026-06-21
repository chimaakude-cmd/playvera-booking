import {
  getVatSettings,
  isVatChargeable,
  UK_VAT_REGISTRATION_THRESHOLD,
  UK_VAT_WARNING_APPROACHING,
  type VatSettings,
} from "./vat-settings";

export type VatBreakdown = {
  vatEnabled: boolean;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  vatRatePercent: number;
};

export type VatThresholdStage = "approaching" | "reached";

export type VatThresholdWarning = {
  stage: VatThresholdStage;
  rollingRevenue: number;
  message: string;
};

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function calculateVatBreakdown(
  netAmount: number,
  settings?: VatSettings,
): VatBreakdown {
  const resolved = settings ?? getVatSettings();

  if (!isVatChargeable(resolved)) {
    return {
      vatEnabled: false,
      netAmount: roundMoney(netAmount),
      vatAmount: 0,
      grossAmount: roundMoney(netAmount),
      vatRatePercent: resolved.vatRatePercent,
    };
  }

  const vatAmount = roundMoney(
    (netAmount * resolved.vatRatePercent) / 100,
  );

  return {
    vatEnabled: true,
    netAmount: roundMoney(netAmount),
    vatAmount,
    grossAmount: roundMoney(netAmount + vatAmount),
    vatRatePercent: resolved.vatRatePercent,
  };
}

export function getVatThresholdWarning(
  rollingTwelveMonthRevenue: number,
): VatThresholdWarning | null {
  if (rollingTwelveMonthRevenue >= UK_VAT_REGISTRATION_THRESHOLD) {
    return {
      stage: "reached",
      rollingRevenue: rollingTwelveMonthRevenue,
      message:
        "You may need to register for VAT. Please speak to an accountant or HMRC.",
    };
  }

  if (rollingTwelveMonthRevenue >= UK_VAT_WARNING_APPROACHING) {
    return {
      stage: "approaching",
      rollingRevenue: rollingTwelveMonthRevenue,
      message: "You are approaching the VAT registration threshold.",
    };
  }

  return null;
}

export function getThresholdProgress(rollingRevenue: number): number {
  return Math.min(
    100,
    Math.round((rollingRevenue / UK_VAT_REGISTRATION_THRESHOLD) * 100),
  );
}

