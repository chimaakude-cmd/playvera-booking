import Link from "next/link";
import {
  CLUB_LOGIN_ERRORS,
  type ClubLoginErrorKind,
} from "@/lib/auth/club-login-messages";

type ClubLoginErrorAlertProps = {
  kind: ClubLoginErrorKind;
  onboardingHref: string;
};

export function ClubLoginErrorAlert({
  kind,
  onboardingHref,
}: ClubLoginErrorAlertProps) {
  const content = CLUB_LOGIN_ERRORS[kind];
  const showRecoveryLinks =
    kind === "wrongPassword" || kind === "noAccount" || kind === "invalidEmail";

  return (
    <div
      role="alert"
      className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      <p className="font-semibold text-red-900">{content.title}</p>
      <p className="mt-1">{content.body}</p>
      {showRecoveryLinks ? (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          <Link
            href={onboardingHref}
            className="font-medium text-violet-700 hover:text-violet-900"
          >
            Create a club account
          </Link>
          <Link
            href="/contact"
            className="font-medium text-violet-700 hover:text-violet-900"
          >
            Contact support
          </Link>
        </div>
      ) : null}
    </div>
  );
}
