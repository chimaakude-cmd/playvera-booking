import { getOrganisation } from "@/lib/organisation/storage";
import {
  estimateNextPayoutDate,
} from "./calculations";
import {
  DEFAULT_CLUB_PAYOUT_PREFERENCES,
  DEFAULT_FINANCE_REPORTS,
  DEFAULT_FRANCHISOR_FEE_SETTINGS,
  DEFAULT_PAYOUT_SCHEDULE,
} from "./defaults";
import type {
  ClubPayoutPreferences,
  FinanceReportRow,
  FranchiseePayoutSchedule,
  FranchisorFeeSettings,
  PerFranchiseeFeeOverride,
  PerFranchiseePayoutOverride,
} from "./types";

export const ORG_PAYOUT_SCHEDULE_KEY = "activora-org-payout-schedule";
export const ORG_FRANCHISOR_FEES_KEY = "activora-org-franchisor-fees";
export const CLUB_PAYOUT_PREFERENCES_KEY = "activora-club-payout-preferences";
export const FINANCE_REPORTS_KEY = "activora-finance-reports";
export const PAYOUT_OVERRIDES_KEY = "activora-org-payout-overrides";
export const FEE_OVERRIDES_KEY = "activora-org-fee-overrides";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function seedIfEmpty<T>(key: string, defaults: T): T {
  if (!isBrowser()) {
    return defaults;
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw) as T;
  } catch {
    return defaults;
  }
}

function save<T>(key: string, value: T): T {
  if (isBrowser()) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore storage errors in stub
    }
  }
  return value;
}

function withComputedNextPayout(
  schedule: FranchiseePayoutSchedule,
): FranchiseePayoutSchedule {
  const next = estimateNextPayoutDate(schedule);
  return {
    ...schedule,
    nextScheduledPayout: next.toISOString(),
  };
}

function withComputedClubPayout(
  prefs: ClubPayoutPreferences,
): ClubPayoutPreferences {
  const next = estimateNextPayoutDate({
    frequency: prefs.frequency,
    monthlyDay: prefs.monthlyDay,
    holdPeriodDays: 0,
  });
  return {
    ...prefs,
    nextEstimatedPayout: next.toISOString(),
  };
}

export function getPayoutSchedule(): FranchiseePayoutSchedule {
  const organisation = getOrganisation();
  const defaults: FranchiseePayoutSchedule = {
    ...DEFAULT_PAYOUT_SCHEDULE,
    organisationId: organisation.id,
  };
  const schedule = seedIfEmpty(ORG_PAYOUT_SCHEDULE_KEY, defaults);
  return withComputedNextPayout(schedule);
}

export function savePayoutSchedule(
  schedule: Omit<FranchiseePayoutSchedule, "nextScheduledPayout" | "updatedAt">,
): FranchiseePayoutSchedule {
  const updated = withComputedNextPayout({
    ...schedule,
    nextScheduledPayout: null,
    updatedAt: new Date().toISOString(),
  });
  return save(ORG_PAYOUT_SCHEDULE_KEY, updated);
}

export function getFranchisorFeeSettings(): FranchisorFeeSettings {
  const organisation = getOrganisation();
  const defaults: FranchisorFeeSettings = {
    ...DEFAULT_FRANCHISOR_FEE_SETTINGS,
    organisationId: organisation.id,
  };
  return seedIfEmpty(ORG_FRANCHISOR_FEES_KEY, defaults);
}

export function saveFranchisorFeeSettings(
  settings: Omit<FranchisorFeeSettings, "updatedAt">,
): FranchisorFeeSettings {
  const updated: FranchisorFeeSettings = {
    ...settings,
    updatedAt: new Date().toISOString(),
  };
  return save(ORG_FRANCHISOR_FEES_KEY, updated);
}

export function getClubPayoutPreferences(
  clubId: string = DEFAULT_CLUB_PAYOUT_PREFERENCES.clubId,
): ClubPayoutPreferences {
  const all = seedIfEmpty<Record<string, ClubPayoutPreferences>>(
    CLUB_PAYOUT_PREFERENCES_KEY,
    {
      [DEFAULT_CLUB_PAYOUT_PREFERENCES.clubId]: DEFAULT_CLUB_PAYOUT_PREFERENCES,
    },
  );
  const prefs = all[clubId] ?? {
    ...DEFAULT_CLUB_PAYOUT_PREFERENCES,
    clubId,
  };
  return withComputedClubPayout(prefs);
}

export function saveClubPayoutPreferences(
  prefs: Omit<ClubPayoutPreferences, "nextEstimatedPayout" | "updatedAt">,
): ClubPayoutPreferences {
  const all = seedIfEmpty<Record<string, ClubPayoutPreferences>>(
    CLUB_PAYOUT_PREFERENCES_KEY,
    {
      [DEFAULT_CLUB_PAYOUT_PREFERENCES.clubId]: DEFAULT_CLUB_PAYOUT_PREFERENCES,
    },
  );
  const updated = withComputedClubPayout({
    ...prefs,
    nextEstimatedPayout: null,
    updatedAt: new Date().toISOString(),
  });
  all[prefs.clubId] = updated;
  save(CLUB_PAYOUT_PREFERENCES_KEY, all);
  return updated;
}

export function getFinanceReports(): FinanceReportRow[] {
  return seedIfEmpty(FINANCE_REPORTS_KEY, DEFAULT_FINANCE_REPORTS);
}

export function getPayoutOverrides(): PerFranchiseePayoutOverride[] {
  return seedIfEmpty<PerFranchiseePayoutOverride[]>(PAYOUT_OVERRIDES_KEY, []);
}

export function savePayoutOverrides(
  overrides: PerFranchiseePayoutOverride[],
): PerFranchiseePayoutOverride[] {
  return save(PAYOUT_OVERRIDES_KEY, overrides);
}

export function getFeeOverrides(): PerFranchiseeFeeOverride[] {
  return seedIfEmpty<PerFranchiseeFeeOverride[]>(FEE_OVERRIDES_KEY, []);
}

export function saveFeeOverrides(
  overrides: PerFranchiseeFeeOverride[],
): PerFranchiseeFeeOverride[] {
  return save(FEE_OVERRIDES_KEY, overrides);
}
