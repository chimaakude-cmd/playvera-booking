import type { Metadata } from "next";
import { JobDetailPage } from "@/components/careers/JobDetailPage";
import { BRAND_NAME } from "@/lib/brand";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug.replace(/-/g, " ")} — Careers`,
    description: `View job details and apply at ${BRAND_NAME}.`,
  };
}

export default async function JobDetailRoutePage({ params }: PageProps) {
  const { slug } = await params;
  return <JobDetailPage slug={slug} />;
}
