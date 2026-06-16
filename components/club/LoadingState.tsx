type LoadingStateProps = {
  message?: string;
};

export function LoadingState({
  message = "Loading...",
}: LoadingStateProps) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
      <p className="text-sm text-zinc-500">{message}</p>
    </div>
  );
}
