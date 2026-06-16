import { PageHeader } from "@/components/club/PageHeader";

type OrganisationPlaceholderPageProps = {
  title: string;
  description: string;
};

export function OrganisationPlaceholderPage({
  title,
  description,
}: OrganisationPlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 px-6 py-10 text-center">
        <p className="text-sm font-medium text-violet-800">
          This section is coming soon.
        </p>
        <p className="mt-2 text-sm text-violet-700/80">
          Group-wide {title.toLowerCase()} for all franchisee clubs will appear
          here.
        </p>
      </div>
    </div>
  );
}
