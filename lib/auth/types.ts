import type { AdminRole } from "@/lib/admin/types";
import type { ClubRole } from "@/lib/club-team";
import type { OrganisationRole } from "@/lib/organisation";

export type UserRole = "parent" | "club" | "admin" | "organisation";

export type ClubAccountType = "standard" | "demo";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  accountType?: ClubAccountType;
  clubRole?: ClubRole;
  adminRole?: AdminRole;
  organisationRole?: OrganisationRole;
};

export type TestAccount = {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  accountType?: ClubAccountType;
  clubRole?: ClubRole;
  adminRole?: AdminRole;
  organisationRole?: OrganisationRole;
};
