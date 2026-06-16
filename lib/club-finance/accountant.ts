/**
 * Club accountant access (localStorage stub).
 *
 * Storage key: activora-club-accountant
 * Database: club_accountant_access in 00013_club_accountant_bookkeeping.sql
 */

export const ACCOUNTANT_STORAGE_KEY = "activora-club-accountant";

export type AccountantInviteStatus = "pending" | "active";

export type InviteAccountantInput = {
  accountantName: string;
  accountantEmail: string;
  firmName: string;
  phone?: string;
};

export type AccountantAccess = {
  id: string;
  accountantName: string;
  accountantEmail: string;
  firmName: string;
  phone?: string;
  status: AccountantInviteStatus;
  invitedAt: string;
  lastActiveAt?: string;
};

export type AccountantAccessState = {
  accountant: AccountantAccess | null;
  pendingInvite: AccountantAccess | null;
};

export const ACCOUNTANT_CAN_PERMISSIONS = [
  "View finance reports",
  "View invoices",
  "View VAT settings",
  "Export transactions",
  "View payouts",
  "View refunds",
] as const;

export const ACCOUNTANT_CANNOT_PERMISSIONS = [
  "Edit activities",
  "Manage bookings",
  "Message parents",
  "Change subscription",
  "Change bank details",
  "Remove owner",
] as const;

function createDefaultState(): AccountantAccessState {
  return {
    accountant: {
      id: "acct-1",
      accountantName: "Helen Price",
      accountantEmail: "helen.price@wrightandco.example",
      firmName: "Wright & Co Chartered Accountants",
      phone: "020 7946 0123",
      status: "active",
      invitedAt: "2025-11-04T10:00:00.000Z",
      lastActiveAt: "2026-06-10T14:30:00.000Z",
    },
    pendingInvite: null,
  };
}

function normalizeState(
  raw: Partial<AccountantAccessState>,
): AccountantAccessState {
  const defaults = createDefaultState();
  return {
    accountant: raw.accountant ?? defaults.accountant,
    pendingInvite: raw.pendingInvite ?? null,
  };
}

export function getAccountantAccessState(): AccountantAccessState {
  if (typeof window === "undefined") {
    return createDefaultState();
  }

  try {
    const raw = localStorage.getItem(ACCOUNTANT_STORAGE_KEY);
    if (!raw) {
      return createDefaultState();
    }

    return normalizeState(JSON.parse(raw) as Partial<AccountantAccessState>);
  } catch {
    return createDefaultState();
  }
}

function saveAccountantAccessState(state: AccountantAccessState): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(ACCOUNTANT_STORAGE_KEY, JSON.stringify(state));
  }
}

export function inviteAccountant(
  input: InviteAccountantInput,
): AccountantAccessState {
  const invite: AccountantAccess = {
    id: `acct-invite-${Date.now()}`,
    accountantName: input.accountantName.trim(),
    accountantEmail: input.accountantEmail.trim(),
    firmName: input.firmName.trim(),
    phone: input.phone?.trim() || undefined,
    status: "pending",
    invitedAt: new Date().toISOString(),
  };

  const state: AccountantAccessState = {
    accountant: getAccountantAccessState().accountant,
    pendingInvite: invite,
  };

  saveAccountantAccessState(state);
  return state;
}

export function removeAccountant(): AccountantAccessState {
  const state: AccountantAccessState = {
    accountant: null,
    pendingInvite: null,
  };
  saveAccountantAccessState(state);
  return state;
}

export function resendAccountantInvite(): AccountantAccessState {
  const state = getAccountantAccessState();
  if (!state.pendingInvite) {
    return state;
  }

  const updated: AccountantAccessState = {
    ...state,
    pendingInvite: {
      ...state.pendingInvite,
      invitedAt: new Date().toISOString(),
    },
  };

  saveAccountantAccessState(updated);
  return updated;
}

export function cancelAccountantInvite(): AccountantAccessState {
  const state = getAccountantAccessState();
  const updated: AccountantAccessState = {
    ...state,
    pendingInvite: null,
  };
  saveAccountantAccessState(updated);
  return updated;
}

export function validateInviteAccountantInput(
  input: InviteAccountantInput,
): Partial<Record<keyof InviteAccountantInput, string>> {
  const errors: Partial<Record<keyof InviteAccountantInput, string>> = {};

  if (!input.accountantName.trim()) {
    errors.accountantName = "Accountant name is required.";
  }
  if (!input.accountantEmail.trim()) {
    errors.accountantEmail = "Accountant email is required.";
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.accountantEmail.trim())
  ) {
    errors.accountantEmail = "Enter a valid email address.";
  }
  if (!input.firmName.trim()) {
    errors.firmName = "Firm name is required.";
  }

  return errors;
}
