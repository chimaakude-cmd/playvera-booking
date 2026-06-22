"use client";

import { useState } from "react";
import { ChevronUp } from "lucide-react";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { HomeHeader } from "@/components/home/HomeHeader";
import { LazySupportLauncher } from "@/components/support/LazySupportLauncher";
import { TransparencyHero } from "@/components/transparency/TransparencyHero";

type FeatureRequest = {
  id: string;
  title: string;
  description: string;
  category: string;
  votes: number;
};

const INITIAL_REQUESTS: FeatureRequest[] = [
  {
    id: "xero-sync",
    title: "Xero accounting integration",
    description: "Automatic sync of invoices, payouts and fees to Xero.",
    category: "Finance",
    votes: 47,
  },
  {
    id: "bulk-sms",
    title: "Bulk SMS to session attendees",
    description: "Send weather cancellations and reminders by text.",
    category: "Communications",
    votes: 38,
  },
  {
    id: "parent-app",
    title: "Native parent mobile app",
    description: "Dedicated iOS and Android app for bookings and notifications.",
    category: "Parents",
    votes: 35,
  },
  {
    id: "custom-fields",
    title: "Custom booking questions",
    description: "More field types for club-specific enrolment questions.",
    category: "Bookings",
    votes: 29,
  },
  {
    id: "multi-currency",
    title: "Multi-currency support",
    description: "Accept bookings in EUR and USD for international camps.",
    category: "Payments",
    votes: 12,
  },
];

export function FeatureRequestsPage() {
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());

  function handleVote(id: string) {
    if (votedIds.has(id)) {
      return;
    }
    setRequests((current) =>
      [...current]
        .map((item) =>
          item.id === id ? { ...item, votes: item.votes + 1 } : item,
        )
        .sort((a, b) => b.votes - a.votes),
    );
    setVotedIds((current) => new Set(current).add(id));
  }

  return (
    <div className="flex min-h-full flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <HomeHeader />

      <main className="flex-1">
        <TransparencyHero
          eyebrow="Support"
          title="Feature requests"
          subtitle="Vote for what you'd like us to build next. Top requests inform our roadmap."
        />

        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
            Have a new idea?{" "}
            <Link href="/contact?topic=feature" className="font-semibold text-teal-700 dark:text-teal-400">
              Submit a request
            </Link>{" "}
            and we may add it to the board. See also our{" "}
            <Link href="/company/roadmap" className="font-semibold text-teal-700 dark:text-teal-400">
              Roadmap
            </Link>
            .
          </p>

          <ul className="space-y-4">
            {requests.map((request) => {
              const hasVoted = votedIds.has(request.id);
              return (
                <li
                  key={request.id}
                  className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900/40 sm:p-5"
                >
                  <button
                    type="button"
                    onClick={() => handleVote(request.id)}
                    disabled={hasVoted}
                    aria-label={`Vote for ${request.title}`}
                    className={`flex shrink-0 flex-col items-center rounded-xl border px-3 py-2 transition-colors ${
                      hasVoted
                        ? "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300"
                        : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-teal-300 hover:bg-teal-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
                    }`}
                  >
                    <ChevronUp className="h-4 w-4" aria-hidden />
                    <span className="text-sm font-bold">{request.votes}</span>
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
                      {request.category}
                    </p>
                    <h2 className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">
                      {request.title}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {request.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </main>

      <SiteFooter />
      <LazySupportLauncher />
    </div>
  );
}
