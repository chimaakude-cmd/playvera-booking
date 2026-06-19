import Link from "next/link";
import {
  PORTAL_LOGIN_ERRORS,
  type PortalLoginErrorKind,
} from "@/lib/auth/portal-login-messages";

type PortalLoginErrorAlertProps = {
  kind: PortalLoginErrorKind;
  signupHref?: string;
  signupLabel?: string;
};

export function PortalLoginErrorAlert({
  kind,
  signupHref,
  signupLabel = "Create account",
}: PortalLoginErrorAlertProps) {
  const content = PORTAL_LOGIN_ERRORS[kind];
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
          {signupHref ? (
            <Link
              href={signupHref}
              className="font-medium text-violet-700 hover:text-violet-900"
            >
              {signupLabel}
            </Link>
          ) : null}
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
