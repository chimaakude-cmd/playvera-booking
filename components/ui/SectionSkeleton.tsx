type SectionSkeletonProps = {
  rows?: number;
  className?: string;
};

export function SectionSkeleton({
  rows = 4,
  className = "",
}: SectionSkeletonProps) {
  return (
    <div
      className={`animate-pulse space-y-3 rounded-2xl border border-zinc-200/80 bg-white p-6 ${className}`}
      aria-hidden
    >
      <div className="h-5 w-40 rounded-lg bg-zinc-100" />
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-10 rounded-xl bg-zinc-50" />
      ))}
    </div>
  );
}
