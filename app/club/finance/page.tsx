import { Suspense } from "react";
import { LoadingState } from "@/components/club/LoadingState";
import { FinancePage } from "@/components/club/finance/FinancePage";

export default function ClubFinancePage() {
  return (
    <Suspense fallback={<LoadingState message="Loading finance..." />}>
      <FinancePage />
    </Suspense>
  );
}
