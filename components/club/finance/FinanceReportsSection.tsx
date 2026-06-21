"use client";

import { formatFinanceShortDate } from "@/lib/club-finance";
import { useClubFinanceData } from "@/lib/club-finance/use-club-finance-data";
import {
  FinanceButton,
  FinanceSection,
  stubExportCsv,
} from "./shared";

export function FinanceReportsSection() {
  const { reports } = useClubFinanceData();

  return (
    <FinanceSection
      title="Reports"
      description="Downloadable finance reports for reconciliation and accounting."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map((report) => (
          <article
            key={report.id}
            className="flex flex-col rounded-xl border border-zinc-200/80 bg-zinc-50/30 p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold text-zinc-900">{report.title}</h3>
              <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500 ring-1 ring-zinc-200">
                {report.format}
              </span>
            </div>
            <p className="mt-2 flex-1 text-sm leading-6 text-zinc-500">
              {report.description}
            </p>
            <p className="mt-3 text-xs text-zinc-400">
              {report.lastGenerated
                ? `Last generated ${formatFinanceShortDate(report.lastGenerated)}`
                : "Not generated yet"}
            </p>
            <div className="mt-4">
              <FinanceButton
                variant="secondary"
                onClick={stubExportCsv(`activora-${report.id}-report.csv`)}
              >
                Download {report.format}
              </FinanceButton>
            </div>
          </article>
        ))}
      </div>
    </FinanceSection>
  );
}
