import { Suspense } from "react";
import { LoginPage } from "@/components/auth/LoginPage";
import { LoadingState } from "@/components/club/LoadingState";
import { TEST_ACCOUNTS } from "@/lib/auth/accounts";

export default function ParentLoginRoute() {
  return (
    <Suspense fallback={<LoadingState message="Loading…" />}>
      <LoginPage
        role="parent"
        title="Parent sign in"
        subtitle="Access your bookings and family profile"
        signupHref="/parent/signup"
        defaultEmail={TEST_ACCOUNTS.parent.email}
      />
    </Suspense>
  );
}
