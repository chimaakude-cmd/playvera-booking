export const CLUB_SETUP_PROGRESS_KEY = "activora-club-setup-progress";

export type SetupProgressStorage = {
  onboardingSeededAt?: string;
  dismissed?: boolean;
};

export type SetupTaskId =
  | "connect_stripe"
  | "add_social"
  | "configure_payouts"
  | "add_team"
  | "create_session"
  | "booking_questions"
  | "upload_cover"
  | "add_vat"
  | "connect_bookkeeping";

export type SetupTask = {
  id: SetupTaskId;
  label: string;
  description: string;
  required: boolean;
  completed: boolean;
  href: string;
};

export const SETUP_BASE_PERCENT = 45;

export const SETUP_TASK_WEIGHTS: Record<SetupTaskId, number> = {
  connect_stripe: 20,
  add_social: 5,
  configure_payouts: 5,
  add_team: 5,
  create_session: 5,
  booking_questions: 5,
  upload_cover: 5,
  add_vat: 5,
  connect_bookkeeping: 0,
};

export type SetupProgressResult = {
  percent: number;
  tasks: SetupTask[];
};
