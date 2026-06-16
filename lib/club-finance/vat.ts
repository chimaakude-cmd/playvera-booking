import {
  getVatSettings,
  isVatChargeable,
  UK_VAT_REGISTRATION_THRESHOLD,
  UK_VAT_WARNING_APPROACHING,
  UK_VAT_WARNING_CLOSE,
  type VatSettings,
} from "./vat-settings";

export type VatBreakdown = {
  vatEnabled: boolean;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  vatRatePercent: number;
};

export type VatThresholdStage = "approaching" | "close" | "reached";

export type VatThresholdWarning = {
  stage: VatThresholdStage;
  rollingRevenue: number;
  message: string;
};

const TAX_DISCLAIMER =
  "This is not tax advice. Please speak to your accountant or HMRC.";

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
      message: `Your revenue through Activora has reached the VAT registration threshold. You may need to register for VAT and add your VAT number. ${TAX_DISCLAIMER}`,
    };
  }

  if (rollingTwelveMonthRevenue >= UK_VAT_WARNING_CLOSE) {
    return {
      stage: "close",
      rollingRevenue: rollingTwelveMonthRevenue,
      message: `You are close to the VAT registration threshold. ${TAX_DISCLAIMER}`,
    };
  }

  if (rollingTwelveMonthRevenue >= UK_VAT_WARNING_APPROACHING) {
    return {
      stage: "approaching",
      rollingRevenue: rollingTwelveMonthRevenue,
      message: `You are approaching the VAT registration threshold. Please speak to an accountant. ${TAX_DISCLAIMER}`,
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

export { TAX_DISCLAIMER };
