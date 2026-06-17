import { Suspense } from "react";
import { StaffAccessPage } from "@/components/auth/StaffAccessPage";

export const metadata = {
  title: "Admin Login | Activora",
};

export default function AdminLoginRoute() {
  return (
    <Suspense fallback={null}>
      <StaffAccessPage
        backHref="/login"
        backLabel="← Back to login options"
      />
    </Suspense>
  );
}
