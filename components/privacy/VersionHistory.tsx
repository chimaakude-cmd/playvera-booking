import type { PrivacyVersionEntry } from "@/constants/privacy";

type VersionHistoryProps = {
  entries: PrivacyVersionEntry[];
  currentVersion: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function VersionHistory({ entries, currentVersion }: VersionHistoryProps) {
  return (
    <section
      id="version-history"
      aria-labelledby="version-history-heading"
      className="scroll-mt-28 border-t border-zinc-200 py-10 print:break-inside-avoid dark:border-zinc-700"
    >
      <h2
        id="version-history-heading"
        className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl"
      >
        Version history
      </h2>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Current version: {currentVersion}
      </p>

      <ol className="mt-6 space-y-4">
        {entries.map((entry) => (
          <li
            key={entry.version}
            className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/40"
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                v{entry.version}
              </span>
              <time
                dateTime={entry.date}
                className="text-xs text-zinc-500 dark:text-zinc-400"
              >
                {formatDate(entry.date)}
              </time>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              {entry.summary}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
