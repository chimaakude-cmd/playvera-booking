import Link from "next/link";
import { PageHeader } from "@/components/club/PageHeader";

type ComingSoonPageProps = {
  title: string;
  description: string;
  nextStep?: string;
};

export function ComingSoonPage({
  title,
  description,
  nextStep,
}: ComingSoonPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-14 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/15 to-violet-500/15 text-2xl">
          ◇
        </div>
        <h2 className="mt-5 text-lg font-semibold text-zinc-900">Coming soon</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-500">
          This section is part of the new club dashboard architecture. We are
          building it section by section after Dashboard Home.
        </p>
        {nextStep ? (
          <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-600">{nextStep}</p>
        ) : null}
        <Link
          href="/club/dashboard"
          className="mt-6 inline-flex rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
