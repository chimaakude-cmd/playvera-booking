"use client";

import { LogoMark } from "@/components/branding";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <div className="flex justify-center">
          <LogoMark size={48} />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-zinc-900">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          An unexpected error occurred. You can try again or refresh the page.
        </p>
        {process.env.NODE_ENV === "development" && error.message ? (
          <p className="mt-4 rounded-xl bg-zinc-50 px-3 py-2 text-left text-xs text-zinc-600">
            {error.message}
          </p>
        ) : null}
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
