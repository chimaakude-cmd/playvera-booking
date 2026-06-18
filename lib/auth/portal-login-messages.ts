export const PORTAL_LOGIN_ERRORS = {
  invalidCredentials: {
    title: "Unable to sign in",
    body: "Email or password incorrect. Please check your details and try again.",
  },
  wrongPortal: {
    title: "Unable to sign in",
    body: "This account belongs to a different portal. Please use the correct sign-in page.",
  },
} as const;

export type PortalLoginErrorKind = keyof typeof PORTAL_LOGIN_ERRORS;
