import { LoginPage } from "@/components/auth/LoginPage";
import { TEST_ACCOUNTS } from "@/lib/auth/accounts";

export function AdminLoginPage() {
  return (
    <LoginPage
      role="admin"
      title="Admin sign in"
      subtitle="Platform administration access"
      signupHref="/admin/signup"
      defaultEmail={TEST_ACCOUNTS.admin.email}
      backHref="/"
      backLabel="← Back to homepage"
    />
  );
}
