import { Suspense } from "react";
import { BugReportForm } from "@/components/bug-report/BugReportForm";

export const metadata = {
  title: "Report a bug — Activora",
};

export default function ReportBugPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f6f7f9] text-sm text-zinc-500">
          Loading…
        </div>
      }
    >
      <BugReportForm />
    </Suspense>
  );
}
