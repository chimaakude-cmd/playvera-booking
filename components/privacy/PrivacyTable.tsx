import type { PrivacyTableColumn } from "@/constants/privacy";

type PrivacyTableProps = {
  caption?: string;
  columns: PrivacyTableColumn[];
  rows: Record<string, string>[];
  labelledBy?: string;
};

export function PrivacyTable({
  caption,
  columns,
  rows,
  labelledBy,
}: PrivacyTableProps) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm print:border-zinc-300 print:shadow-none dark:border-zinc-700 dark:bg-zinc-900/50">
      <table
        className="min-w-full divide-y divide-zinc-200 text-left text-sm dark:divide-zinc-700"
        aria-labelledby={labelledBy}
      >
        {caption ? (
          <caption className="px-4 py-3 text-left text-xs text-zinc-500 dark:text-zinc-400">
            {caption}
          </caption>
        ) : null}
        <thead className="bg-zinc-50 dark:bg-zinc-800/80">
          <tr>
            {columns.map((column) => (
              <th
                key={column.accessor}
                scope="col"
                className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-200"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map((row, index) => (
            <tr
              key={`${row[columns[0]?.accessor ?? "row"]}-${index}`}
              className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
            >
              {columns.map((column) => (
                <td
                  key={column.accessor}
                  className="px-4 py-3 align-top text-zinc-600 dark:text-zinc-300"
                >
                  {row[column.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
