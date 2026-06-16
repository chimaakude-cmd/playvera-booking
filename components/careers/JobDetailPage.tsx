"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { HomeHeader } from "@/components/home/HomeHeader";
import { LazySupportLauncher } from "@/components/support/LazySupportLauncher";
import { ApplyForm } from "@/components/careers/ApplyForm";
import {
  CONTRACT_TYPE_LABELS,
  getPublicCareerJobBySlugOrId,
  incrementJobViews,
  JOB_DEPARTMENT_LABELS,
  WORK_LOCATION_LABELS,
  type CareerJob,
} from "@/lib/careers";

type JobDetailPageProps = {
  slug: string;
};

export function JobDetailPage({ slug }: JobDetailPageProps) {
  const [job, setJob] = useState<CareerJob | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const found = getPublicCareerJobBySlugOrId(slug);
    setJob(found);
    setLoaded(true);
    if (found) {
      incrementJobViews(found.id);
    }
  }, [slug]);

  if (!loaded) {
    return (
      <div className="flex min-h-full flex-col bg-white text-zinc-900">
        <HomeHeader />
        <main className="flex-1 bg-[#f6f7f9] p-12 text-center text-sm text-zinc-500">
          Loading…
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-full flex-col bg-white text-zinc-900">
        <HomeHeader />
        <main className="flex-1 bg-[#f6f7f9] p-12 text-center">
          <h1 className="text-xl font-bold text-zinc-900">Job not found</h1>
          <Link
            href="/careers"
            className="mt-4 inline-block text-sm font-semibold text-teal-700 hover:text-teal-900"
          >
            View all careers →
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-white text-zinc-900">
      <HomeHeader />

      <main className="flex-1 bg-[#f6f7f9]">
        <div className="border-b border-zinc-200 bg-gradient-to-b from-[#072B44] to-[#0a3d5c] text-white">
          <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
            <Link
              href="/careers"
              className="inline-flex items-center gap-2 text-sm font-medium text-teal-200 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              All careers
            </Link>
            <p className="mt-6 text-sm font-bold uppercase tracking-wider text-teal-300">
              {JOB_DEPARTMENT_LABELS[job.department]}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              {job.title}
            </h1>
            <dl className="mt-6 flex flex-wrap gap-4 text-sm text-teal-50/90">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" aria-hidden />
                <dd>{job.location}</dd>
              </div>
              <div>
                <dt className="sr-only">Salary</dt>
                <dd>{job.salary}</dd>
              </div>
              <div>
                <dt className="sr-only">Contract</dt>
                <dd>{CONTRACT_TYPE_LABELS[job.contractType]}</dd>
              </div>
              <div>
                <dt className="sr-only">Work location</dt>
                <dd>{WORK_LOCATION_LABELS[job.workLocation]}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-zinc-900">About the role</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">
                  {job.description}
                </p>
              </section>

              <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-zinc-900">
                  Responsibilities
                </h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-600">
                  {job.responsibilities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-zinc-900">Requirements</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-600">
                  {job.requirements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-zinc-900">Benefits</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-600">
                  {job.benefits.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="lg:col-span-2">
              {job.status === "open" ? (
                <ApplyForm job={job} />
              ) : (
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
                  <p className="font-semibold text-zinc-900">
                    This role is no longer accepting applications.
                  </p>
                  <Link
                    href="/careers"
                    className="mt-4 inline-block text-sm font-semibold text-teal-700 hover:text-teal-900"
                  >
                    View open roles →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
      <LazySupportLauncher />
    </div>
  );
}
