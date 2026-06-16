import Link from "next/link";

export function ActivitiesEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-16 text-center">
      <h2 className="text-lg font-semibold text-zinc-900">No activities yet</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
        Create your first activity to start accepting bookings from parents.
      </p>
      <Link
        href="/club/create-session"
        className="mt-6 inline-flex rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
      >
        + Add activity
      </Link>
    </div>
  );
}
