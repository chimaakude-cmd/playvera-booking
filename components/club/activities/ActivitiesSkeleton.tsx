export function ActivitiesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-40 rounded-lg bg-zinc-200" />
          <div className="h-4 w-64 rounded bg-zinc-100" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 rounded-lg bg-zinc-100" />
          <div className="h-10 w-32 rounded-lg bg-zinc-200" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-32 rounded-2xl border border-zinc-200/80 bg-white"
          />
        ))}
      </div>

      <div className="h-36 rounded-2xl border border-zinc-200/80 bg-white" />

      <div className="space-y-3 rounded-2xl border border-zinc-200/80 bg-white p-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-16 rounded-xl bg-zinc-50" />
        ))}
      </div>
    </div>
  );
}
