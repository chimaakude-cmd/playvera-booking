import { Suspense } from "react";
import { LoadingState } from "@/components/club/LoadingState";
import { RegistersPage } from "@/components/club/registers/RegistersPage";

export default function ClubRegistersPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading registers..." />}>
      <RegistersPage />
    </Suspense>
  );
}
