import type { AdminRole } from "@/lib/admin/types";
import type { ClubRole } from "@/lib/club-team";
import type { OrganisationRole } from "@/lib/organisation";

export type UserRole = "parent" | "club" | "admin" | "organisation";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  clubRole?: ClubRole;
  adminRole?: AdminRole;
  organisationRole?: OrganisationRole;
};

export type TestAccount = {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  clubRole?: ClubRole;
  adminRole?: AdminRole;
  organisationRole?: OrganisationRole;
};
