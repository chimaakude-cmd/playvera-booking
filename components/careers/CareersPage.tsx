"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  GraduationCap,
  Heart,
  Palmtree,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { HomeHeader } from "@/components/home/HomeHeader";
import { LazySupportLauncher } from "@/components/support/LazySupportLauncher";
import { JobCard } from "@/components/careers/JobCard";
import { TalentPoolForm } from "@/components/careers/TalentPoolForm";
import {
  getOpenCareerJobs,
  JOB_DEPARTMENT_LABELS,
  type CareerJob,
  type JobDepartment,
} from "@/lib/careers";

const BENEFITS = [
  {
    icon: Palmtree,
    emoji: "🏖️",
    title: "Paid leave",
    description: "25 days annual leave plus bank holidays.",
  },
  {
    icon: Heart,
    emoji: "💚",
    title: "Sick pay",
    description: "Company sick pay from your first day.",
  },
  {
    icon: TrendingUp,
    emoji: "📈",
    title: "Growth",
    description: "Clear progression paths as we scale.",
  },
  {
    icon: Briefcase,
    emoji: "🏠",
    title: "Flexible working",
    description: "Remote, hybrid and office options by role.",
  },
  {
    icon: GraduationCap,
    emoji: "📚",
    title: "Learning budget",
    description: "Annual budget for courses, books and conferences.",
  },
  {
    icon: Sparkles,
    emoji: "⚽",
    title: "Real impact",
    description: "Help families and clubs across the UK every day.",
  },
];

const VALUES = [
  {
    title: "Families first",
    description:
      "Every decision starts with the families and clubs we serve.",
  },
  {
    title: "Own it",
    description:
      "Take responsibility, move fast, and follow through on commitments.",
  },
  {
    title: "Build together",
    description:
      "Collaborate openly — the best ideas can come from anywhere.",
  },
  {
    title: "Keep learning",
    description:
      "Stay curious, ask questions, and share what you discover.",
  },
  {
    title: "Play fair",
    description:
      "Integrity, transparency, and respect in every interaction.",
  },
];

const DEPARTMENTS: Array<JobDepartment | "all"> = [
  "all",
  "sales",
  "customer_success",
  "engineering",
  "operations",
  "marketing",
  "coaching",
  "support",
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export function CareersPage() {
  const [jobs, setJobs] = useState<CareerJob[]>([]);
  const [department, setDepartment] = useState<JobDepartment | "all">("all");
  const [showTalentModal, setShowTalentModal] = useState(false);

  useEffect(() => {
    setJobs(getOpenCareerJobs());
  }, []);

  const filteredJobs = useMemo(() => {
    if (department === "all") {
      return jobs;
    }
    return jobs.filter((job) => job.department === department);
  }, [jobs, department]);

  return (
    <div className="flex min-h-full flex-col bg-white text-zinc-900">
      <HomeHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-zinc-100 bg-gradient-to-b from-[#072B44] to-[#0a3d5c] text-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <p className="text-sm font-bold uppercase tracking-wider text-teal-300">
              Careers at Activora
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Work at Activora
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-teal-50/90">
              Help us build the future of bookings for clubs, schools and
              families.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => scrollToId("open-roles")}
                className="rounded-xl bg-teal-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-300/50"
              >
                View open roles
              </button>
              <button
                type="button"
                onClick={() => scrollToId("why-join")}
                className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                Why work with us
              </button>
            </div>
          </div>
        </section>

        {/* Why join */}
        <section
          id="why-join"
          className="border-b border-zinc-100 bg-gradient-to-b from-teal-50/60 to-white py-16 sm:py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-zinc-900">
              Why join Activora
            </h2>
            <p className="mt-3 max-w-2xl text-zinc-600">
              We&apos;re a small, ambitious team building software that helps
              children play, learn and grow.
            </p>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {BENEFITS.map((benefit) => (
                <div
                  key={benefit.title}
                  className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
                >
                  <span className="text-2xl" aria-hidden>
                    {benefit.emoji}
                  </span>
                  <benefit.icon
                    className="mt-3 h-5 w-5 text-teal-600"
                    aria-hidden
                  />
                  <h3 className="mt-2 font-bold text-zinc-900">
                    {benefit.title}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="border-b border-zinc-100 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Users className="h-7 w-7 text-teal-600" aria-hidden />
              <h2 className="text-3xl font-bold text-zinc-900">Our values</h2>
            </div>
            <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {VALUES.map((value, index) => (
                <li
                  key={value.title}
                  className="rounded-2xl border border-zinc-200 bg-white p-6"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 text-lg font-bold text-zinc-900">
                    {value.title}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600">
                    {value.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Open roles */}
        <section
          id="open-roles"
          className="bg-[#f6f7f9] py-16 sm:py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-zinc-900">Open roles</h2>
            <p className="mt-3 text-zinc-600">
              Find your next role helping clubs and families thrive.
            </p>

            {jobs.length > 0 ? (
              <>
                <div
                  className="mt-8 flex flex-wrap gap-2"
                  role="tablist"
                  aria-label="Filter by department"
                >
                  {DEPARTMENTS.map((dept) => (
                    <button
                      key={dept}
                      type="button"
                      role="tab"
                      aria-selected={department === dept}
                      onClick={() => setDepartment(dept)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        department === dept
                          ? "bg-teal-600 text-white"
                          : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      {dept === "all"
                        ? "All"
                        : JOB_DEPARTMENT_LABELS[dept]}
                    </button>
                  ))}
                </div>

                {filteredJobs.length > 0 ? (
                  <div className="mt-8 grid gap-5 lg:grid-cols-2">
                    {filteredJobs.map((job) => (
                      <JobCard key={job.id} job={job} />
                    ))}
                  </div>
                ) : (
                  <p className="mt-8 text-sm text-zinc-600">
                    No roles in this category right now.
                  </p>
                )}
              </>
            ) : (
              <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-10 text-center">
                <p className="text-lg font-semibold text-zinc-900">
                  No open roles right now
                </p>
                <p className="mt-2 text-sm text-zinc-600">
                  We&apos;re not hiring for specific roles at the moment, but
                  we&apos;d still love to hear from you.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowTalentModal(true)}
                    className="rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
                  >
                    Join talent pool
                  </button>
                  <Link
                    href="/careers/talent-pool"
                    className="rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-teal-700 transition hover:border-teal-300"
                  >
                    Submit CV
                  </Link>
                </div>
              </div>
            )}

            {jobs.length > 0 ? (
              <div className="mt-12 rounded-2xl border border-teal-200 bg-teal-50/40 p-8 text-center">
                <p className="font-semibold text-zinc-900">
                  Don&apos;t see the right role?
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  Join our talent pool and we&apos;ll reach out when something
                  matches.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowTalentModal(true)}
                    className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
                  >
                    Join talent pool
                  </button>
                  <Link
                    href="/careers/talent-pool"
                    className="text-sm font-semibold text-teal-700 hover:text-teal-900"
                  >
                    Submit CV →
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <SiteFooter />
      <LazySupportLauncher />

      {showTalentModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="talent-modal-title"
        >
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setShowTalentModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 id="talent-modal-title" className="pr-8 text-xl font-bold">
              Join our talent pool
            </h2>
            <div className="mt-4">
              <TalentPoolForm
                compact
                onSuccess={() => setShowTalentModal(false)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
