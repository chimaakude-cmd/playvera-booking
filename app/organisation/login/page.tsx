import { LoginPage } from "@/components/auth/LoginPage";
import { TEST_ACCOUNTS } from "@/lib/auth/accounts";

export default function OrganisationLoginPage() {
  return (
    <LoginPage
      role="organisation"
      title="Franchisor login"
      subtitle="Sign in to manage your franchisee clubs and organisation settings."
      signupHref="/organisation/signup"
      signupLabel="Sign up as franchisor"
      defaultEmail={TEST_ACCOUNTS.organisation.email}
      backHref="/login"
      backLabel="← Back to login options"
    />
  );
}
