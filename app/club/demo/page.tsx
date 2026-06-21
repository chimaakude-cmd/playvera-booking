import Link from "next/link";
import { DemoDataBadge } from "@/components/club/DemoDataBadge";
import { PageHeader } from "@/components/club/PageHeader";

const DEMO_EXPERIENCES = [
  {
    href: "/club/demo-customers",
    title: "Example customers",
    description:
      "Preview the CRM with sample parents, children, bookings, and spend.",
  },
  {
    href: "/club/demo-register",
    title: "Example registers",
    description:
      "See how block-session registers, attendance, and parent contact details work.",
  },
] as const;

export default function ClubDemoPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Club demo experiences"
        description="Explore Activora club tools with clearly labelled example data. Live club pages never show these samples."
        action={<DemoDataBadge />}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {DEMO_EXPERIENCES.map((experience) => (
          <Link
            key={experience.href}
            href={experience.href}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-zinc-900">
              {experience.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {experience.description}
            </p>
            <span className="mt-4 inline-flex text-sm font-semibold text-teal-700">
              Open demo →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
