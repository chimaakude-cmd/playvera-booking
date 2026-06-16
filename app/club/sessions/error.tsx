"use client";

export default function ClubSessionsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">
          Activities
        </p>
        <h2 className="mt-3 text-lg font-semibold text-zinc-900">
          Could not load activities
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Something went wrong while loading your sessions. Try again to
          recover this page.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pink-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
