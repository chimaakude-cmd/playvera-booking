import {
  LOGIN_ERROR_MESSAGES,
  type LoginErrorKind,
} from "./login-messages";

export type ClubLoginErrorKind = LoginErrorKind;

const TITLE = "Unable to sign in";

export const CLUB_LOGIN_ERRORS = Object.fromEntries(
  (Object.keys(LOGIN_ERROR_MESSAGES) as LoginErrorKind[]).map((kind) => [
    kind,
    { title: TITLE, body: LOGIN_ERROR_MESSAGES[kind] },
  ]),
) as Record<ClubLoginErrorKind, { title: string; body: string }>;
