import type { Metadata } from "next";
import { JobDetailPage } from "@/components/careers/JobDetailPage";
import { BRAND_NAME } from "@/lib/brand";
import { SEED_CAREER_JOBS } from "@/lib/careers/defaults";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function findSeedJob(slug: string) {
  return SEED_CAREER_JOBS.find(
    (job) => job.slug === slug || job.id === slug,
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = findSeedJob(slug);
  if (!job) {
    return {
      title: "Job — Careers",
      description: `View job details and apply at ${BRAND_NAME}.`,
    };
  }
  return {
    title: `${job.title} — Careers`,
    description: `Apply for ${job.title} at ${BRAND_NAME}. ${job.location} · ${job.salary}`,
  };
}

export default async function JobDetailRoutePage({ params }: PageProps) {
  const { slug } = await params;
  return <JobDetailPage slug={slug} />;
}
