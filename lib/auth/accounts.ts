import type { TestAccount } from "./types";

export const TEST_ACCOUNTS = {
  club: {
    email: "club@test.activeora.co.uk",
    password: "Test123!",
    name: "Club Owner",
    role: "club",
    clubRole: "owner",
  },
  demo_club: {
    email: "demo@activora.co.uk",
    password: "Test123!",
    name: "Demo Club",
    role: "club",
    clubRole: "owner",
    accountType: "demo",
  },
  parent: {
    email: "parent@test.activeora.co.uk",
    password: "Test123!",
    name: "Parent Tester",
    role: "parent",
  },
  owner: {
    email: "owner@activora.co.uk",
    password: "Test123!",
    name: "Platform Owner",
    role: "admin",
    adminRole: "owner",
  },
  admin: {
    email: "admin@test.activeora.co.uk",
    password: "Test123!",
    name: "Super Admin",
    role: "admin",
    adminRole: "super_admin",
  },
  finance_admin: {
    email: "finance@test.activeora.co.uk",
    password: "Test123!",
    name: "Finance Admin",
    role: "admin",
    adminRole: "finance_admin",
  },
  support_admin: {
    email: "support@test.activeora.co.uk",
    password: "Test123!",
    name: "Support Admin",
    role: "admin",
    adminRole: "support_admin",
  },
  organisation: {
    email: "organisation@test.activeora.co.uk",
    password: "Test123!",
    name: "Organisation Owner",
    role: "organisation",
    organisationRole: "owner",
  },
} as const satisfies Record<string, TestAccount>;

export const ALL_TEST_ACCOUNTS: TestAccount[] = Object.values(TEST_ACCOUNTS);

export function findTestAccount(email: string, password: string): TestAccount | null {
  const normalized = email.trim().toLowerCase();
  return (
    ALL_TEST_ACCOUNTS.find(
      (account) =>
        account.email.toLowerCase() === normalized && account.password === password,
    ) ?? null
  );
}
