/**
 * Club finance domain types.
 *
 * Storage (today): empty in production; dev-only demo data via data.ts
 * Database: future tables in supabase/migrations/00011_club_finance.sql
 */

export type PaymentStatus =
  | "paid"
  | "pending"
  | "failed"
  | "refunded"
  | "partially_refunded";

export type PayoutStatus =
  | "paid_out"
  | "pending"
  | "in_transit"
  | "held";

export type RefundStatus = "completed" | "pending" | "failed";

export type FailedPaymentRetryStatus =
  | "ready"
  | "retrying"
  | "exhausted"
  | "manual_required";

export type AccountingIntegrationId =
  | "freeagent"
  | "quickbooks"
  | "xero"
  | "sage";

export type AccountingIntegrationStatus =
  | "not_connected"
  | "connected"
  | "syncing";

export type FinanceTab =
  | "overview"
  | "transactions"
  | "payouts"
  | "failed-payments"
  | "refunds"
  | "fees"
  | "stripe"
  | "payment-providers"
  | "invoices"
  | "vat"
  | "accountant"
  | "integrations"
  | "reports";

export type FinanceOverviewMetrics = {
  totalRevenue: number;
  netRevenue: number;
  platformFees: number;
  stripeFees: number;
  pendingPayouts: number;
  failedPayments: number;
  refunds: number;
  averageBookingValue: number;
  revenueThisMonth: number;
  revenueLast30Days: number;
};

export type FinanceTransaction = {
  id: string;
  bookingId: string;
  date: string;
  parentName: string;
  parentEmail: string;
  childName: string;
  activityName: string;
  venue: string;
  grossAmount: number;
  stripeFee: number;
  platformFee: number;
  netAmount: number;
  paymentStatus: PaymentStatus;
  payoutStatus: PayoutStatus;
};

export type FinancePayout = {
  id: string;
  date: string;
  amount: number;
  status: PayoutStatus;
  reference: string;
  linkedTransactionIds: string[];
};

export type PayoutSummary = {
  availableBalance: number;
  pendingBalance: number;
  lastPayoutDate: string | null;
  lastPayoutAmount: number | null;
  nextEstimatedPayoutDate: string | null;
};

export type FailedPayment = {
  id: string;
  bookingId: string;
  parentName: string;
  parentEmail: string;
  activityName: string;
  amount: number;
  reason: string;
  lastAttempted: string;
  retryStatus: FailedPaymentRetryStatus;
  actionNeeded: string;
};

export type FinanceRefund = {
  id: string;
  date: string;
  customerName: string;
  customerEmail: string;
  bookingId: string;
  bookingReference: string;
  activityName: string;
  refundAmount: number;
  reason: string;
  status: RefundStatus;
};

export type FinanceReportType =
  | "revenue"
  | "activity_revenue"
  | "venue_revenue"
  | "customer_spend"
  | "fee"
  | "payout_reconciliation"
  | "refund";

export type FinanceReport = {
  id: FinanceReportType;
  title: string;
  description: string;
  format: "CSV" | "PDF";
  lastGenerated: string | null;
};

export type AccountingIntegration = {
  id: AccountingIntegrationId;
  name: string;
  description: string;
  status: AccountingIntegrationStatus;
  syncItems: string[];
};

export type FinanceFilterOptions = {
  activities: string[];
  venues: string[];
};

export type MonthlyInvoiceLineItem = {
  bookingReference: string;
  activityName: string;
  venue: string;
  grossAmount: number;
  netAmount: number;
  vatAmount: number;
  platformFee: number;
  stripeFee: number;
  netPayout: number;
  paymentDate: string;
  payoutDate: string | null;
};

export type MonthlyInvoice = {
  id: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  totalSales: number;
  totalBookings: number;
  grossRevenue: number;
  platformFees: number;
  stripeFees: number;
  refunds: number;
  netPaidOut: number;
  payoutDestination: string;
  payoutDates: string[];
  vatNet: number;
  vatAmount: number;
  lineItems: MonthlyInvoiceLineItem[];
};

export type MonthlyRevenuePoint = {
  month: string;
  revenue: number;
};
