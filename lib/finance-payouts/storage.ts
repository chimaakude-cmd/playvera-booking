import { shouldShowClubDemoData } from "@/lib/club-demo-mode";
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

/** Legacy seeded demo balances — must never display for real clubs. */
const LEGACY_SEED_BALANCES = new Set([2847.5, 412.0, 2847.6, 1842.35]);

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

function createEmptyClubPayoutPreferences(
  clubId: string,
): ClubPayoutPreferences {
  return {
    ...DEFAULT_CLUB_PAYOUT_PREFERENCES,
    clubId,
    availableBalance: 0,
    pendingBalance: 0,
  };
}

/** Balances come from Stripe Connect — never from localStorage for real clubs. */
function stripStoredBalances(
  prefs: ClubPayoutPreferences,
): ClubPayoutPreferences {
  const hasLegacySeed =
    LEGACY_SEED_BALANCES.has(prefs.availableBalance) ||
    LEGACY_SEED_BALANCES.has(prefs.pendingBalance);

  if (
    !hasLegacySeed &&
    prefs.availableBalance === 0 &&
    prefs.pendingBalance === 0
  ) {
    return prefs;
  }

  return {
    ...prefs,
    availableBalance: 0,
    pendingBalance: 0,
  };
}

function migrateClubPayoutPreferencesCache(
  all: Record<string, ClubPayoutPreferences>,
): Record<string, ClubPayoutPreferences> {
  let changed = false;
  const next: Record<string, ClubPayoutPreferences> = {};

  for (const [clubId, prefs] of Object.entries(all)) {
    const stripped = stripStoredBalances(prefs);
    next[clubId] = stripped;
    if (
      stripped.availableBalance !== prefs.availableBalance ||
      stripped.pendingBalance !== prefs.pendingBalance
    ) {
      changed = true;
    }
  }

  if (changed) {
    save(CLUB_PAYOUT_PREFERENCES_KEY, next);
  }

  return next;
}

function buildInitialClubPayoutPreferencesMap(): Record<
  string,
  ClubPayoutPreferences
> {
  const emptyPrefs = createEmptyClubPayoutPreferences(
    DEFAULT_CLUB_PAYOUT_PREFERENCES.clubId,
  );

  if (shouldShowClubDemoData()) {
    return {
      [DEFAULT_CLUB_PAYOUT_PREFERENCES.clubId]: {
        ...DEFAULT_CLUB_PAYOUT_PREFERENCES,
        availableBalance: 0,
        pendingBalance: 0,
      },
    };
  }

  return {
    [DEFAULT_CLUB_PAYOUT_PREFERENCES.clubId]: emptyPrefs,
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
  const emptyPrefs = createEmptyClubPayoutPreferences(clubId);
  const all = migrateClubPayoutPreferencesCache(
    seedIfEmpty<Record<string, ClubPayoutPreferences>>(
      CLUB_PAYOUT_PREFERENCES_KEY,
      buildInitialClubPayoutPreferencesMap(),
    ),
  );
  const prefs =
    all[clubId] ??
    (shouldShowClubDemoData()
      ? { ...DEFAULT_CLUB_PAYOUT_PREFERENCES, clubId, availableBalance: 0, pendingBalance: 0 }
      : emptyPrefs);

  return withComputedClubPayout(stripStoredBalances(prefs));
}

export function saveClubPayoutPreferences(
  prefs: Omit<ClubPayoutPreferences, "nextEstimatedPayout" | "updatedAt">,
): ClubPayoutPreferences {
  const all = migrateClubPayoutPreferencesCache(
    seedIfEmpty<Record<string, ClubPayoutPreferences>>(
      CLUB_PAYOUT_PREFERENCES_KEY,
      buildInitialClubPayoutPreferencesMap(),
    ),
  );
  const updated = withComputedClubPayout({
    ...prefs,
    availableBalance: 0,
    pendingBalance: 0,
    nextEstimatedPayout: null,
    updatedAt: new Date().toISOString(),
  });
  all[prefs.clubId] = updated;
  save(CLUB_PAYOUT_PREFERENCES_KEY, all);
  return updated;
}

export function getFinanceReports(): FinanceReportRow[] {
  if (!shouldShowClubDemoData()) {
    return seedIfEmpty(FINANCE_REPORTS_KEY, []);
  }
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
