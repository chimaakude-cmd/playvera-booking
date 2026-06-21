import { Suspense } from "react";
import { LoadingState } from "@/components/club/LoadingState";
import { RegistersPage } from "@/components/club/registers/RegistersPage";

export default function ClubDemoRegisterPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading demo registers..." />}>
      <RegistersPage />
    </Suspense>
  );
}
