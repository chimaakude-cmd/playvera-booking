type SupabaseLikeError = {
  message?: string;
  code?: string;
};

export const ADMIN_USERS_SETUP_MESSAGE =
  "Admin system is being set up. Please contact support.";

const ADMIN_TABLE_NAMES = ["admin_users", "admin_invites", "admin_user_audit_log"];

function errorMessage(error: SupabaseLikeError): string {
  return error.message?.toLowerCase() ?? "";
}

export function isAdminUsersTableMissingError(error: SupabaseLikeError): boolean {
  const message = errorMessage(error);
  const code = error.code ?? "";

  if (code === "PGRST205" || code === "42P01") {
    return ADMIN_TABLE_NAMES.some((table) => message.includes(table));
  }

  if (message.includes("schema cache") && ADMIN_TABLE_NAMES.some((table) => message.includes(table))) {
    return true;
  }

  if (message.includes("could not find") && ADMIN_TABLE_NAMES.some((table) => message.includes(table))) {
    return true;
  }

  return ADMIN_TABLE_NAMES.some(
    (table) =>
      message.includes("relation") &&
      message.includes(table) &&
      message.includes("does not exist"),
  );
}

export function toAdminUsersFriendlyError(error: SupabaseLikeError): Error {
  if (isAdminUsersTableMissingError(error)) {
    return new Error(ADMIN_USERS_SETUP_MESSAGE);
  }

  return new Error(error.message ?? "An unexpected admin users error occurred.");
}

export function adminUsersErrorStatus(error: unknown): number {
  if (error instanceof Error && error.message === ADMIN_USERS_SETUP_MESSAGE) {
    return 503;
  }

  return 500;
}

export function adminUsersErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
