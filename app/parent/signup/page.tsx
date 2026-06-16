import { Suspense } from "react";
import { SignupPage } from "@/components/auth/SignupPage";
import { LoadingState } from "@/components/club/LoadingState";

export default function ParentSignupRoute() {
  return (
    <Suspense fallback={<LoadingState message="Loading…" />}>
      <SignupPage
        role="parent"
        title="Create parent account"
        subtitle="Book activities and manage your children"
        loginHref="/parent/login"
      />
    </Suspense>
  );
}
