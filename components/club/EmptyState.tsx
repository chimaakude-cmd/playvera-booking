type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-xl text-zinc-400">
        ○
      </div>
      <h3 className="mt-4 text-base font-semibold text-zinc-900">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
        {description}
      </p>
      {actionLabel && actionHref ? (
        <a
          href={actionHref}
          className="mt-6 inline-flex rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          {actionLabel}
        </a>
      ) : null}
    </div>
  );
}
