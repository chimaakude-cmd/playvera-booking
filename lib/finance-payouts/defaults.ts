import { DEMO_ORGANISATION_ID } from "@/lib/organisation/defaults";
import type {
  ClubPayoutPreferences,
  FinanceReportRow,
  FranchiseePayoutSchedule,
  FranchisorFeeSettings,
} from "./types";

export const DEFAULT_PAYOUT_SCHEDULE: FranchiseePayoutSchedule = {
  organisationId: DEMO_ORGANISATION_ID,
  frequency: "monthly",
  monthlyDay: 1,
  holdPeriodDays: 3,
  nextScheduledPayout: null,
  appliesToAll: true,
  allowPerFranchiseeOverride: false,
  updatedAt: "2026-06-01T10:00:00.000Z",
};

export const DEFAULT_FRANCHISOR_FEE_SETTINGS: FranchisorFeeSettings = {
  organisationId: DEMO_ORGANISATION_ID,
  feeType: "percentage",
  percentageFee: 5,
  minimumFee: 25,
  fixedFee: 150,
  billingPeriod: "monthly",
  appliesToAll: true,
  allowPerFranchiseeOverride: false,
  updatedAt: "2026-06-01T10:00:00.000Z",
};

export const DEFAULT_CLUB_PAYOUT_PREFERENCES: ClubPayoutPreferences = {
  clubId: "local-provider",
  frequency: "every_7_days",
  monthlyDay: 1,
  nextEstimatedPayout: null,
  availableBalance: 2847.5,
  pendingBalance: 412.0,
  updatedAt: "2026-06-01T10:00:00.000Z",
};

export const DEFAULT_FINANCE_REPORTS: FinanceReportRow[] = [
  {
    id: "report_001",
    clubId: "franchisee_club_001",
    clubName: "PlayVera Juniors — Central",
    grossSales: 18450,
    stripeFees: 312.65,
    activeoraFees: 369,
    franchisorFees: 922.5,
    netPayout: 16845.85,
    payoutDate: "2026-06-01T09:00:00.000Z",
    payoutStatus: "paid",
  },
  {
    id: "report_002",
    clubId: "franchisee_club_002",
    clubName: "PlayVera Juniors — North",
    grossSales: 11200,
    stripeFees: 189.8,
    activeoraFees: 224,
    franchisorFees: 560,
    netPayout: 10226.2,
    payoutDate: "2026-06-01T09:00:00.000Z",
    payoutStatus: "paid",
  },
  {
    id: "report_003",
    clubId: "franchisee_club_001",
    clubName: "PlayVera Juniors — Central",
    grossSales: 16230,
    stripeFees: 275.1,
    activeoraFees: 324.6,
    franchisorFees: 811.5,
    netPayout: 14818.8,
    payoutDate: "2026-05-01T09:00:00.000Z",
    payoutStatus: "paid",
  },
  {
    id: "report_004",
    clubId: "franchisee_club_002",
    clubName: "PlayVera Juniors — North",
    grossSales: 9850,
    stripeFees: 166.95,
    activeoraFees: 197,
    franchisorFees: 492.5,
    netPayout: 8993.55,
    payoutDate: "2026-05-01T09:00:00.000Z",
    payoutStatus: "paid",
  },
  {
    id: "report_005",
    clubId: "franchisee_club_001",
    clubName: "PlayVera Juniors — Central",
    grossSales: 4210,
    stripeFees: 71.35,
    activeoraFees: 84.2,
    franchisorFees: 210.5,
    netPayout: 3843.95,
    payoutDate: "2026-06-14T09:00:00.000Z",
    payoutStatus: "processing",
  },
];
