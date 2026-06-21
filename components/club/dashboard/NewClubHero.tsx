"use client";

import Link from "next/link";
import type { NewClubChecklistItem } from "@/lib/club/new-club-mode";

type PrimaryAction = {
  title: string;
  description: string;
  href: string;
  completed: boolean;
};

type NewClubHeroProps = {
  clubName: string;
  primaryStepsRemaining: number;
  estimatedMinutesRemaining: string;
  checklist: NewClubChecklistItem[];
};

function buildPrimaryActions(
  checklist: NewClubChecklistItem[],
): PrimaryAction[] {
  const activity = checklist.find((item) => item.id === "create_first_activity");
  const payments = checklist.find((item) => item.id === "connect_payments");
  const profile = checklist.find(
    (item) => item.id === "complete_public_profile",
  );

  return [
    {
      title: "Create your first activity",
      description: "Publish your first session for parents",
      href: activity?.href ?? "/club/create-session",
      completed: activity?.completed ?? false,
    },
    {
      title: "Connect payments",
      description: "Connect Stripe to accept paid bookings",
      href: payments?.href ?? "/club/finance?tab=payment-providers",
      completed: payments?.completed ?? false,
    },
    {
      title: "Complete your public profile",
      description: "Add logo, description and club details",
      href: profile?.href ?? "/club/settings/profile",
      completed: profile?.completed ?? false,
    },
  ];
}

export function NewClubHero({
  clubName,
  primaryStepsRemaining,
  estimatedMinutesRemaining,
  checklist,
}: NewClubHeroProps) {
  const primaryActions = buildPrimaryActions(checklist);
  const stepLabel =
    primaryStepsRemaining === 1
      ? "1 step left to launch your first activity"
      : `${primaryStepsRemaining} steps left to launch your first activity`;

  return (
    <section className="overflow-hidden rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-600 via-violet-700 to-violet-900 p-6 text-white shadow-lg shadow-violet-900/20 sm:p-8">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Welcome back, {clubName} 👋
        </h1>
        <p className="mt-2 text-base text-violet-100 sm:text-lg">
          Let&apos;s get your first activity live.
        </p>
        <p className="mt-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-violet-50 ring-1 ring-white/20">
          {stepLabel}
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {primaryActions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className={`group rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 ${
              action.completed
                ? "border-emerald-300/40 bg-emerald-500/15 hover:bg-emerald-500/20"
                : "border-white/20 bg-white/10 hover:border-white/30 hover:bg-white/15"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-white">{action.title}</p>
              {action.completed ? (
                <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-100">
                  Done
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-violet-100">{action.description}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-violet-200 group-hover:text-white">
              {action.completed ? "Review" : "Get started"} →
            </p>
          </Link>
        ))}
      </div>

      <p className="mt-6 text-sm text-violet-200">{estimatedMinutesRemaining}</p>
    </section>
  );
}
