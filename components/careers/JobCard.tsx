"use client";

import Link from "next/link";
import {
  CONTRACT_TYPE_LABELS,
  JOB_DEPARTMENT_LABELS,
  WORK_LOCATION_LABELS,
  type CareerJob,
} from "@/lib/careers";

function formatPostedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type JobCardProps = {
  job: CareerJob;
};

export function JobCard({ job }: JobCardProps) {
  return (
    <article className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 group-hover:text-teal-800">
            {job.title}
          </h3>
          <p className="mt-1 text-sm font-medium text-teal-700">
            {JOB_DEPARTMENT_LABELS[job.department]}
          </p>
        </div>
        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
          {WORK_LOCATION_LABELS[job.workLocation]}
        </span>
      </div>

      <dl className="mt-4 grid gap-2 text-sm text-zinc-600 sm:grid-cols-2">
        <div>
          <dt className="sr-only">Location</dt>
          <dd>📍 {job.location}</dd>
        </div>
        <div>
          <dt className="sr-only">Salary</dt>
          <dd>💷 {job.salary}</dd>
        </div>
        <div>
          <dt className="sr-only">Contract</dt>
          <dd>📋 {CONTRACT_TYPE_LABELS[job.contractType]}</dd>
        </div>
        <div>
          <dt className="sr-only">Posted</dt>
          <dd>📅 Posted {formatPostedDate(job.postedAt)}</dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link
          href={`/careers/${job.slug}`}
          className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        >
          Apply
        </Link>
        <Link
          href={`/careers/${job.slug}`}
          className="text-sm font-semibold text-teal-700 hover:text-teal-900"
        >
          View details →
        </Link>
      </div>
    </article>
  );
}
