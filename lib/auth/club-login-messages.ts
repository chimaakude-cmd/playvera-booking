export const CLUB_LOGIN_ERRORS = {
  invalidCredentials: {
    title: "Unable to sign in",
    body: "We couldn't sign you in with those details. Please check your email and password and try again.",
  },
  notFound: {
    title: "Unable to sign in",
    body: "We couldn't find an account with those details.",
  },
  unverified: {
    title: "Unable to sign in",
    body: "Please verify your email before signing in.",
  },
  rateLimited: {
    title: "Unable to sign in",
    body: "Too many attempts. Please try again shortly.",
  },
} as const;

export type ClubLoginErrorKind = keyof typeof CLUB_LOGIN_ERRORS;
